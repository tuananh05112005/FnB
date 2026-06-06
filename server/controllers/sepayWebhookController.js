// ==============================================================
// TÊN FILE: sepayWebhookController.js
// MÔ TẢ: Bộ điều khiển tiếp nhận và xử lý Webhook tự động từ dịch vụ thanh toán SePay.
//        - Xác thực API Key và Signature HMAC từ SePay để bảo mật giao dịch.
//        - Trích xuất mã giao dịch (ví dụ: DH20260606) từ nội dung chuyển khoản.
//        - Ghi nhật ký lịch sử Webhook (logs) để giám sát và đối soát.
//        - Tự động so khớp số tiền thanh toán thực nhận với số tiền hóa đơn yêu cầu.
//        - Chuyển trạng thái đơn sang Đã thanh toán (markPaymentPaid) và cộng điểm thưởng tích lũy.
// ==============================================================

const crypto = require("crypto");

const { getQuery } = require("../config/db");
const { markPaymentPaid } = require("./paymentController");

// Hàm tiện ích in nhật ký log Webhook theo từng bước để dễ gỡ lỗi (Debugging)
function logStep(message, details = {}) {
  console.log(`[SePay Webhook] ${message}`, details);
}

// So sánh hai chuỗi ký tự an toàn thời gian thực (tránh tấn công Timing Attack)
function secureEqual(a, b) {
  const aBuffer = Buffer.from(String(a || ""));
  const bBuffer = Buffer.from(String(b || ""));

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

// Xác thực API Key gửi trong Header Authorization từ SePay
function verifyApiKey(req) {
  const expectedApiKey = process.env.SEPAY_API_KEY;

  if (!expectedApiKey) {
    logStep("SEPAY_API_KEY chưa cấu hình, bỏ qua xác thực API key");
    return true;
  }

  const authorization = req.get("authorization");
  const isValid = secureEqual(authorization, `Apikey ${expectedApiKey}`);

  logStep("Kiểm tra API key", {
    hasAuthorizationHeader: Boolean(authorization),
    isValid,
  });

  return isValid;
}

// Xác thực tính toàn vẹn dữ liệu bằng chữ ký số HMAC SHA256 (nếu cấu hình)
function verifyHmac(req) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const signature = req.get("x-sepay-signature") || "";
  const timestamp = Number(req.get("x-sepay-timestamp"));
  const rawBody = req.rawBody || JSON.stringify(req.body || {});

  if (!signature || !timestamp) {
    logStep("Thiếu HMAC signature hoặc timestamp");
    return false;
  }

  const now = Math.floor(Date.now() / 1000);

  // Cho phép sai lệch thời gian tối đa 5 phút (300 giây) để tránh tấn công Replay Attack
  if (Math.abs(now - timestamp) > 300) {
    logStep("HMAC timestamp quá hạn", { timestamp, now });
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

  const isValid = secureEqual(signature, expectedSignature);

  logStep("Kiểm tra HMAC", { isValid });

  return isValid;
}

// Trích xuất mã hóa đơn đặt hàng (định dạng DHxxxxxx) từ nội dung tin nhắn chuyển khoản
function extractTransactionCode(payload) {
  const searchableText = [
    payload.content,
    payload.description,
    payload.code,
  ]
    .filter(Boolean)
    .join(" ");

  // Tìm regex khớp ký tự DH theo sau là ít nhất 8 chữ số (hỗ trợ cả tiền tố CART_DH cho thanh toán giỏ hàng)
  const matches = searchableText.match(/(?:CART_)?DH\d{8,}/gi) || [];

  if (matches.length) {
    return matches
      .sort((a, b) => b.length - a.length)[0]
      .toUpperCase();
  }

  return "";
}


// Tiếp nhận Webhook giao dịch chuyển khoản ngân hàng thành công từ SePay
exports.handleSepayWebhook = async (req, res) => {
  const payload = req.body || {};

  logStep("Nhận request", {
    path: req.originalUrl,
    body: payload,
  });

  try {
    // 1. Xác thực bảo mật request từ SePay
    if (!verifyApiKey(req) || !verifyHmac(req)) {
      logStep("Từ chối webhook vì xác thực thất bại");

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

    logStep("Đã tách thông tin giao dịch", {
      sepayTransactionId,
      transactionCode,
      transferType: payload.transferType,
      transferAmount: payload.transferAmount,
      referenceCode: payload.referenceCode,
    });

    // 2. Ghi nhật ký log Webhook vào Database để đối soát sau này
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
      logStep("Webhook bị trùng lặp (duplicate payload), bỏ qua xử lý tiếp theo", {
        sepayTransactionId,
      });
    }

    // 3. Nếu không tìm thấy mã đơn hàng hoặc là giao dịch rút tiền (transferType !== "in"), bỏ qua
    if (!transactionCode || payload.transferType !== "in") {
      await query(
        "UPDATE sepay_webhook_logs SET status = 'ignored' WHERE sepay_transaction_id = ?",
        [sepayTransactionId],
      );

      logStep("Bỏ qua webhook vì không phải tiền vào hoặc không có mã DH", {
        transactionCode,
        transferType: payload.transferType,
      });

      return res.json({ success: true, ignored: true });
    }

    // 4. Tìm kiếm thông tin thanh toán trong Database dựa trên mã giao dịch (transaction_code)
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

      logStep("Không tìm thấy payment theo mã giao dịch", { transactionCode });

      return res.json({ success: true, ignored: true });
    }

    const payment = payments[0];
    const transferAmount = Number(payload.transferAmount || 0);

    logStep("Tìm thấy payment", {
      paymentId: payment.id,
      expectedAmount: Number(payment.amount || 0),
      transferAmount,
      currentStatus: payment.payment_status,
    });

    // 5. Kiểm tra chênh lệch số tiền (Đề phòng trường hợp khách chuyển thiếu tiền)
    if (transferAmount < Number(payment.amount || 0)) {
      await query(
        `
        UPDATE sepay_webhook_logs
        SET status = 'amount_mismatch', payment_id = ?
        WHERE sepay_transaction_id = ?
        `,
        [payment.id, sepayTransactionId],
      );

      logStep("Số tiền chuyển khoản không đủ, không xác nhận thanh toán", {
        paymentId: payment.id,
        expectedAmount: Number(payment.amount || 0),
        transferAmount,
      });

      return res.json({ success: true, ignored: true });
    }

    // 6. Đánh dấu hóa đơn đã thanh toán thành công (markPaymentPaid)
    const paidResult = await markPaymentPaid(payment, query);

    // 7. Cập nhật nhật ký webhook trạng thái sang đã xác nhận (confirmed)
    await query(
      `
      UPDATE sepay_webhook_logs
      SET status = 'confirmed', payment_id = ?
      WHERE sepay_transaction_id = ?
      `,
      [payment.id, sepayTransactionId],
    );

    logStep("Xác nhận thanh toán thành công", {
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
    console.error("[SePay Webhook] Lỗi xử lý webhook:", err);

    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
