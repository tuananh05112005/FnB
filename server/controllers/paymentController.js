const { getDB, getQuery } = require("../config/db");

async function markPaymentPaid(payment, query) {
  if (payment.payment_status === "paid") {
    return { alreadyPaid: true, pointsEarned: 0 };
  }

  const result = await query(
    `
    UPDATE payments
    SET
      payment_status = 'paid',
      confirmed_at = NOW()
    WHERE id = ?
    AND payment_status <> 'paid'
    `,
    [payment.id],
  );

  if (!result.affectedRows) {
    return { alreadyPaid: true, pointsEarned: 0 };
  }

  await query(
    `
    UPDATE cart
    SET status = 'completed'
    WHERE user_id = ?
    AND product_id = ?
    `,
    [payment.user_id, payment.product_id],
  );

  const pointsEarned = Math.floor(payment.amount / 10000);

  if (pointsEarned > 0) {
    await query(
      `
      UPDATE users
      SET points = points + ?
      WHERE id = ?
      `,
      [pointsEarned, payment.user_id],
    );
  }

  return { alreadyPaid: false, pointsEarned };
}

/*
====================================================
PAYMENT CONTROLLER FULL VERSION
- Banking QR
- Pending payment
- Admin confirm
- Auto status
- MySQL only
====================================================
*/

/*
====================================================
CREATE PAYMENT
====================================================
*/

exports.create = async (req, res) => {
  const {
    user_id,
    product_id,
    name,
    address,
    phone,
    payment_method,
    amount,
    voucher_id,
    use_points,
    generateQR,
  } = req.body;

  try {
    const query = getQuery();

    /*
    ============================================
    USE USER POINTS
    ============================================
    */

    if (use_points) {
      await query("UPDATE users SET points = 0 WHERE id = ?", [user_id]);
    }

    /*
    ============================================
    UPDATE VOUCHER
    ============================================
    */

    if (voucher_id) {
      await query(
        `
        UPDATE vouchers
        SET used_count = used_count + 1
        WHERE id = ?
        `,
        [voucher_id],
      );
    }

    /*
    ============================================
    CASH PAYMENT
    ============================================
    */

    if (payment_method === "cash") {
      const result = await query(
        `
        INSERT INTO payments (
          user_id,
          product_id,
          name,
          address,
          phone,
          payment_method,
          amount,
          payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          user_id,
          product_id,
          name,
          address,
          phone,
          payment_method,
          amount,
          "paid",
        ],
      );

      /*
      ============================================
      UPDATE CART
      ============================================
      */

      await query(
        `
        UPDATE cart
        SET status = 'completed'
        WHERE user_id = ?
        AND product_id = ?
        `,
        [user_id, product_id],
      );

      /*
      ============================================
      ADD USER POINTS
      ============================================
      */

      const pointsEarned = Math.floor(amount / 10000);

      await query(
        `
        UPDATE users
        SET points = points + ?
        WHERE id = ?
        `,
        [pointsEarned, user_id],
      );

      return res.status(201).json({
        success: true,
        message: "Thanh toan tien mat thanh cong",
        orderId: result.insertId,
      });
    }

    /*
    ============================================
    BANKING PAYMENT
    ============================================
    */

    if (payment_method === "banking" && generateQR) {
      const transactionCode = `DH${Date.now()}`;

      const result = await query(
        `
        INSERT INTO payments (
          user_id,
          product_id,
          name,
          address,
          phone,
          payment_method,
          amount,
          payment_status,
          transaction_code
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          user_id,
          product_id,
          name,
          address,
          phone,
          payment_method,
          amount,
          "pending",
          transactionCode,
        ],
      );

      /*
      ============================================
      VIETQR
      ============================================
      */

      const bankCode = process.env.SEPAY_BANK_CODE || "ICB";
      const bankAccount = process.env.SEPAY_BANK_ACCOUNT || "101879499413";
      const qrTemplate = process.env.SEPAY_QR_TEMPLATE || "compact";
      // const transferContent = `SEVQR ${transactionCode}`;
      const transferContent = transactionCode;


      const qrUrl =
        `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankCode)}` +
        `&acc=${encodeURIComponent(bankAccount)}` +
        `&template=${encodeURIComponent(qrTemplate)}` +
        `&amount=${amount}` +
        `&content=${encodeURIComponent(transferContent)}`;


      return res.status(200).json({
        success: true,
        message: "Tao QR thanh cong",
        paymentId: result.insertId,
        transactionCode,
        transferContent,
        bankCode,
        bankAccount,
        qrUrl,
        payment_status: "pending",
      });
    }

    res.status(400).json({
      success: false,
      message: "Phuong thuc thanh toan khong hop le",
    });
  } catch (err) {
    console.error("Loi create payment:", err);

    res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};

/*
====================================================
GET PAYMENT STATUS
====================================================
*/

exports.getPaymentStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const query = getQuery();

    const payments = await query(
      `
      SELECT
        id,
        payment_status,
        confirmed_at,
        transaction_code,
        created_at
      FROM payments
      WHERE id = ?
      `,
      [id],
    );

    if (!payments.length) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay thanh toan",
      });
    }

    res.json(payments[0]);
  } catch (err) {
    console.error("Loi getPaymentStatus:", err);

    res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};

/*
====================================================
ADMIN LIST ALL PAYMENTS
====================================================
*/

exports.adminList = async (_req, res) => {
  try {
    const query = getQuery();

    const payments = await query(
      `
      SELECT
        p.*,
        u.email,
        pr.name AS product_name,
        pr.image
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN products pr ON p.product_id = pr.id
      ORDER BY p.id DESC
      `,
    );

    res.json(payments);
  } catch (err) {
    console.error("Loi adminList:", err);

    res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};

/*
====================================================
ADMIN LIST PENDING
====================================================
*/

exports.adminListPending = async (_req, res) => {
  try {
    const query = getQuery();

    const payments = await query(
      `
      SELECT
        p.*,
        u.email,
        pr.name AS product_name,
        pr.image
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN products pr ON p.product_id = pr.id
      WHERE p.payment_status = 'pending'
      ORDER BY p.created_at DESC
      `,
    );

    res.json(payments);
  } catch (err) {
    console.error("Loi adminListPending:", err);

    res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};

/*
====================================================
ADMIN CONFIRM PAYMENT
====================================================
*/

exports.adminConfirmPending = async (req, res) => {
  const { id } = req.params;

  try {
    const query = getQuery();

    const payments = await query(
      `
      SELECT *
      FROM payments
      WHERE id = ?
      `,
      [id],
    );

    if (!payments.length) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay thanh toan",
      });
    }

    const payment = payments[0];

    if (payment.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Thanh toan da duoc xac nhan",
      });
    }

    await markPaymentPaid(payment, query);

    res.json({
      success: true,
      message: "Da xac nhan da nhan tien",
    });
  } catch (err) {
    console.error("Loi adminConfirmPending:", err);

    res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};

/*
====================================================
PAYMENT HISTORY BY USER
====================================================
*/

exports.historyByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = getQuery();

    const payments = await query(
      `
      SELECT
        p.id AS payment_id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.created_at,
        p.transaction_code,
        pr.name AS product_name,
        pr.image,
        pr.price,
        pr.size
      FROM payments p
      JOIN products pr
      ON p.product_id = pr.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      `,
      [user_id],
    );

    res.json(payments);
  } catch (err) {
    console.error("Loi historyByUser:", err);

    res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};

/*
====================================================
DELETE PAYMENT
====================================================
*/

exports.remove = async (req, res) => {
  const { payment_id } = req.params;

  try {
    const query = getQuery();

    const result = await query(
      `
      DELETE FROM payments
      WHERE id = ?
      `,
      [payment_id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay thanh toan",
      });
    }

    res.json({
      success: true,
      message: "Xoa thanh toan thanh cong",
    });
  } catch (err) {
    console.error("Loi remove payment:", err);

    res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};

exports.markPaymentPaid = markPaymentPaid;
