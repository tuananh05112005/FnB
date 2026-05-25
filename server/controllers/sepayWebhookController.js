const crypto = require("crypto");

const { getQuery } = require("../config/db");
const { markPaymentPaid } = require("./paymentController");

function logStep(message, details = {}) {
  console.log(`[SePay Webhook] ${message}`, details);
}

function secureEqual(a, b) {
  const aBuffer = Buffer.from(String(a || ""));
  const bBuffer = Buffer.from(String(b || ""));

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyApiKey(req) {
  const expectedApiKey = process.env.SEPAY_API_KEY;

  if (!expectedApiKey) {
    logStep("SEPAY_API_KEY chua cau hinh, bo qua xac thuc API key");
    return true;
  }

  const authorization = req.get("authorization");
  const isValid = secureEqual(authorization, `Apikey ${expectedApiKey}`);

  logStep("Kiem tra API key", {
    hasAuthorizationHeader: Boolean(authorization),
    isValid,
  });

  return isValid;
}

function verifyHmac(req) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const signature = req.get("x-sepay-signature") || "";
  const timestamp = Number(req.get("x-sepay-timestamp"));
  const rawBody = req.rawBody || JSON.stringify(req.body || {});

  if (!signature || !timestamp) {
    logStep("Thieu HMAC signature hoac timestamp");
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestamp) > 300) {
    logStep("HMAC timestamp qua han", { timestamp, now });
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

  const isValid = secureEqual(signature, expectedSignature);

  logStep("Kiem tra HMAC", { isValid });

  return isValid;
}

function extractTransactionCode(payload) {
  const searchableText = [
    payload.content,
    payload.description,
    payload.code,
  ]
    .filter(Boolean)
    .join(" ");

  const matches = searchableText.match(/DH\d{8,}/gi) || [];

  if (matches.length) {
    return matches
      .sort((a, b) => b.length - a.length)[0]
      .toUpperCase();
  }

  return "";
}

async function ensureWebhookLogTable(query) {
  await query(`
    CREATE TABLE IF NOT EXISTS sepay_webhook_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sepay_transaction_id VARCHAR(100) NOT NULL UNIQUE,
      payment_id INT NULL,
      transaction_code VARCHAR(100) NULL,
      transfer_amount BIGINT NULL,
      transfer_type VARCHAR(20) NULL,
      reference_code VARCHAR(100) NULL,
      payload LONGTEXT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'received',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

exports.handleSepayWebhook = async (req, res) => {
  const payload = req.body || {};

  logStep("Nhan request", {
    path: req.originalUrl,
    body: payload,
  });

  try {
    if (!verifyApiKey(req) || !verifyHmac(req)) {
      logStep("Tu choi webhook vi xac thuc that bai");

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const query = getQuery();
    const transactionCode = extractTransactionCode(payload);
    const sepayTransactionId = String(
      payload.id ?? payload.referenceCode ?? `${transactionCode}-${payload.transferAmount}`,
    );

    logStep("Da tach thong tin giao dich", {
      sepayTransactionId,
      transactionCode,
      transferType: payload.transferType,
      transferAmount: payload.transferAmount,
      referenceCode: payload.referenceCode,
    });

    await ensureWebhookLogTable(query);

    const logResult = await query(
      `
      INSERT IGNORE INTO sepay_webhook_logs (
        sepay_transaction_id,
        transaction_code,
        transfer_amount,
        transfer_type,
        reference_code,
        payload
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        sepayTransactionId,
        transactionCode || null,
        payload.transferAmount || null,
        payload.transferType || null,
        payload.referenceCode || null,
        JSON.stringify(payload),
      ],
    );

    if (!logResult.affectedRows) {
      logStep("Webhook bi lap, tiep tuc xu ly de retry neu lan truoc fail", {
        sepayTransactionId,
      });
    }

    if (!transactionCode || payload.transferType !== "in") {
      await query(
        "UPDATE sepay_webhook_logs SET status = 'ignored' WHERE sepay_transaction_id = ?",
        [sepayTransactionId],
      );

      logStep("Bo qua webhook vi khong phai tien vao hoac khong co ma DH", {
        transactionCode,
        transferType: payload.transferType,
      });

      return res.json({ success: true, ignored: true });
    }

    const payments = await query(
      `
      SELECT *
      FROM payments
      WHERE transaction_code = ?
      LIMIT 1
      `,
      [transactionCode],
    );

    if (!payments.length) {
      await query(
        "UPDATE sepay_webhook_logs SET status = 'payment_not_found' WHERE sepay_transaction_id = ?",
        [sepayTransactionId],
      );

      logStep("Khong tim thay payment theo ma giao dich", { transactionCode });

      return res.json({ success: true, ignored: true });
    }

    const payment = payments[0];
    const transferAmount = Number(payload.transferAmount || 0);

    logStep("Tim thay payment", {
      paymentId: payment.id,
      expectedAmount: Number(payment.amount || 0),
      transferAmount,
      currentStatus: payment.payment_status,
    });

    if (transferAmount < Number(payment.amount || 0)) {
      await query(
        `
        UPDATE sepay_webhook_logs
        SET status = 'amount_mismatch', payment_id = ?
        WHERE sepay_transaction_id = ?
        `,
        [payment.id, sepayTransactionId],
      );

      logStep("So tien khong du, khong xac nhan payment", {
        paymentId: payment.id,
        expectedAmount: Number(payment.amount || 0),
        transferAmount,
      });

      return res.json({ success: true, ignored: true });
    }

    const paidResult = await markPaymentPaid(payment, query);

    await query(
      `
      UPDATE sepay_webhook_logs
      SET status = 'confirmed', payment_id = ?
      WHERE sepay_transaction_id = ?
      `,
      [payment.id, sepayTransactionId],
    );

    logStep("Xac nhan thanh toan thanh cong", {
      paymentId: payment.id,
      transactionCode,
      alreadyPaid: paidResult.alreadyPaid,
      pointsEarned: paidResult.pointsEarned,
    });

    return res.json({
      success: true,
      paymentId: payment.id,
      transactionCode,
      status: "confirmed",
    });
  } catch (err) {
    console.error("[SePay Webhook] Loi xu ly webhook:", err);

    return res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};
