// ==============================================================
// TÊN FILE: paymentController.js
// MÔ TẢ: Controller xử lý nghiệp vụ Thanh toán (Payment) của hệ thống FnB.
//        Quản lý các luồng thanh toán Tiền mặt (Cash) và Chuyển khoản qua ngân hàng (VietQR).
//        Tự động tích điểm thành viên (1 điểm cho mỗi 10.000 VNĐ chi tiêu), đồng bộ trạng thái
//        giỏ hàng (status = 'completed'), tạo thông báo hệ thống và phát thông báo real-time
//        qua Socket.io tới Admin/Nhân viên và Khách hàng khi có giao dịch thành công.
// ==============================================================

const { getDB, getQuery } = require("../config/db");

/**
 * markPaymentPaid: Hàm nội bộ xử lý nghiệp vụ khi một hóa đơn được xác nhận đã chuyển khoản thành công.
 * - Cập nhật trạng thái thanh toán thành 'paid' trong bảng payments.
 * - Cập nhật trạng thái giỏ hàng (cart) của món hàng tương ứng sang 'completed' (đã hoàn thành thanh toán).
 * - Tích điểm cho thành viên (cộng 1 điểm cho mỗi 10.000 VNĐ).
 * - Ghi nhận bản ghi thông báo mới cho khách hàng trong DB.
 * - Phát các sự kiện Socket.io báo đơn hàng đã thanh toán thành công tới Admin/Nhân viên và Khách hàng.
 */
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

  // Cập nhật trạng thái giỏ hàng bằng order_code (transaction_code)
  const cartUpdateResult = await query(
    `
    UPDATE cart
    SET status = 'completed'
    WHERE order_code = ?
    `,
    [payment.transaction_code],
  );

  const isCartPayment = payment.transaction_code && payment.transaction_code.startsWith("CART_");

  // Fallback nếu không khớp order_code (dành cho giao dịch cũ)
  if (cartUpdateResult.affectedRows === 0) {
    if (isCartPayment) {
      await query(
        `
        UPDATE cart
        SET status = 'completed'
        WHERE user_id = ?
        AND status = 'pending'
        `,
        [payment.user_id],
      );
    } else {
      await query(
        `
        UPDATE cart
        SET status = 'completed'
        WHERE user_id = ?
        AND product_id = ?
        AND status = 'pending'
        `,
        [payment.user_id, payment.product_id],
      );
    }
  }

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

  // Lấy tên các sản phẩm trong đơn hàng để tạo thông báo chi tiết
  let displayProductName = "Đơn hàng";
  const cartProducts = await query(
    `
    SELECT p.name 
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.order_code = ?
    `,
    [payment.transaction_code]
  );
  if (cartProducts && cartProducts.length > 0) {
    displayProductName = cartProducts.map(p => p.name).join(", ");
  } else {
    const products = await query("SELECT name FROM products WHERE id = ?", [payment.product_id]);
    const productName = products.length ? products[0].name : "Sản phẩm";
    displayProductName = isCartPayment ? "Giỏ hàng" : productName;
  }

  // Luu thong bao vao database cho khach hang
  await query(
    "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
    [payment.user_id, `Đơn hàng #${payment.transaction_code} (${displayProductName}) đã được thanh toán thành công.`]
  );

  if (global.io) {
    global.io.to("managers").emit("orderPaid", {
      id: payment.id,
      user_id: payment.user_id,
      name: payment.name,
      amount: payment.amount,
      payment_method: payment.payment_method,
      productName: displayProductName
    });
    global.io.to(`user:${payment.user_id}`).emit("orderPaidCustomer", {
      id: payment.id,
      amount: payment.amount,
      name: payment.name,
      productName: displayProductName
    });
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

/**
 * create: API khởi tạo hóa đơn thanh toán mới (POST /api/payments).
 * Hỗ trợ thanh toán tiền mặt (Cash) và chuyển khoản ngân hàng (Banking) tự sinh mã QR động (VietQR).
 * Đồng thời áp dụng trừ điểm tích lũy hoặc voucher giảm giá nếu có.
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
    is_cart,
    order_code,
  } = req.body;

  try {
    const query = getQuery();

    let productName = "Sản phẩm";
    if (product_id) {
      const products = await query("SELECT name FROM products WHERE id = ?", [product_id]);
      if (products && products.length > 0) {
        productName = products[0].name;
      }
    }

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
      const isCart = is_cart || false;
      const transactionCode = order_code || (isCart ? `CART_DH${Date.now()}` : `DH${Date.now()}`);

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
          "paid",
          transactionCode,
        ],
      );

      /*
      ============================================
      UPDATE CART
      ============================================
      */

      const cartUpdateResult = await query(
        `
        UPDATE cart
        SET status = 'completed'
        WHERE order_code = ?
        `,
        [transactionCode],
      );

      if (cartUpdateResult.affectedRows === 0) {
        if (isCart) {
          await query(
            `
            UPDATE cart
            SET status = 'completed'
            WHERE user_id = ?
            AND status = 'pending'
            `,
            [user_id],
          );
        } else {
          await query(
            `
            UPDATE cart
            SET status = 'completed'
            WHERE user_id = ?
            AND product_id = ?
            AND status = 'pending'
            `,
            [user_id, product_id],
          );
        }
      }

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

      // Lấy tên các sản phẩm trong đơn hàng để làm thông báo
      let displayProductName = "Đơn hàng";
      const cartProducts = await query(
        `
        SELECT p.name 
        FROM cart c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.order_code = ?
        `,
        [transactionCode]
      );
      if (cartProducts && cartProducts.length > 0) {
        displayProductName = cartProducts.map(p => p.name).join(", ");
      } else {
        displayProductName = isCart ? "Giỏ hàng" : productName;
      }

      // Luu thong bao vao database cho khach hang
      await query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [user_id, `Đơn hàng #${transactionCode} (${displayProductName}) trị giá ${new Intl.NumberFormat("vi-VN").format(amount)}đ đã được thanh toán thành công (Tiền mặt).`]
      );

      if (global.io) {
        global.io.to("managers").emit("newOrder", {
          id: result.insertId,
          user_id,
          name,
          amount,
          payment_method: "cash",
          payment_status: "paid",
          productName: displayProductName,
          created_at: new Date()
        });
        global.io.to(`user:${user_id}`).emit("orderPaidCustomer", {
          id: result.insertId,
          amount: amount,
          name: name,
          productName: displayProductName
        });
      }

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
      const isCart = is_cart || false;
      const transactionCode = order_code || (isCart ? `CART_DH${Date.now()}` : `DH${Date.now()}`);

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
      const bankName = process.env.SEPAY_BANK_NAME || "VietinBank";
      const bankAccount = process.env.SEPAY_BANK_ACCOUNT || "101879499413";
      const qrTemplate = process.env.SEPAY_QR_TEMPLATE || "compact";
      const transferContent = `SEVQR ${transactionCode}`;

      const qrUrl =
        `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankCode)}` +
        `&acc=${encodeURIComponent(bankAccount)}` +
        `&template=${encodeURIComponent(qrTemplate)}` +
        `&amount=${amount}` +
        `&des=${encodeURIComponent(transferContent)}` +
        `&content=${encodeURIComponent(transferContent)}` +
        `&addInfo=${encodeURIComponent(transferContent)}`;

      // Lấy tên các sản phẩm trong đơn hàng
      let displayProductName = "Đơn hàng";
      const cartProducts = await query(
        `
        SELECT p.name 
        FROM cart c 
        JOIN products p ON c.product_id = p.id 
        WHERE c.order_code = ?
        `,
        [transactionCode]
      );
      if (cartProducts && cartProducts.length > 0) {
        displayProductName = cartProducts.map(p => p.name).join(", ");
      } else {
        displayProductName = productName;
      }

      // Luu thong bao vao database cho khach hang
      await query(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        [user_id, `Đơn hàng #${transactionCode} (${displayProductName}) trị giá ${new Intl.NumberFormat("vi-VN").format(amount)}đ đã được tạo thành công (Chờ chuyển khoản).`]
      );

      if (global.io) {
        global.io.to("managers").emit("newOrder", {
          id: result.insertId,
          user_id,
          name,
          amount,
          payment_method: "banking",
          payment_status: "pending",
          productName: displayProductName,
          created_at: new Date()
        });
      }

      return res.status(200).json({
        success: true,
        message: "Tao QR thanh cong",
        paymentId: result.insertId,
        transactionCode,
        transferContent,
        bankCode,
        bankName,
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

/**
 * getPaymentStatus: API tra cứu trạng thái thanh toán của hóa đơn bằng ID (GET /api/payments/status/:id).
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

/**
 * adminList: API lấy toàn bộ danh sách lịch sử thanh toán trong hệ thống (GET /api/admin/payments).
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
        pr.image,
        COALESCE(
          (
            SELECT c.status 
            FROM cart c 
            WHERE c.order_code = p.transaction_code 
            LIMIT 1
          ),
          (
            SELECT c.status 
            FROM cart c 
            WHERE c.user_id = p.user_id 
              AND c.product_id = p.product_id 
            ORDER BY ABS(TIMESTAMPDIFF(SECOND, c.updated_at, p.created_at)) ASC
            LIMIT 1
          )
        ) AS status,
        COALESCE(
          (
            SELECT c.id 
            FROM cart c 
            WHERE c.order_code = p.transaction_code 
            LIMIT 1
          ),
          (
            SELECT c.id 
            FROM cart c 
            WHERE c.user_id = p.user_id 
              AND c.product_id = p.product_id 
            ORDER BY ABS(TIMESTAMPDIFF(SECOND, c.updated_at, p.created_at)) ASC
            LIMIT 1
          )
        ) AS cart_id
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

/**
 * adminListPending: API lấy danh sách các giao dịch thanh toán chuyển khoản đang ở trạng thái chờ xử lý (pending) (GET /api/admin/payments/pending).
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

/**
 * adminConfirmPending: API cho phép Admin/Nhân viên phê duyệt thủ công một giao dịch chuyển khoản ngân hàng đang chờ (PUT /api/admin/payments/pending/:id/confirm).
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

/**
 * historyByUser: API truy vấn danh sách lịch sử giao dịch mua sắm của một khách hàng cụ thể (GET /api/payments/history/:user_id).
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
        pr.size,
        COALESCE(
          (
            SELECT c.status 
            FROM cart c 
            WHERE c.order_code = p.transaction_code 
            LIMIT 1
          ),
          (
            SELECT c.status 
            FROM cart c 
            WHERE c.user_id = p.user_id 
              AND c.product_id = p.product_id 
            ORDER BY ABS(TIMESTAMPDIFF(SECOND, c.updated_at, p.created_at)) ASC
            LIMIT 1
          )
        ) AS status,
        COALESCE(
          (
            SELECT c.id 
            FROM cart c 
            WHERE c.order_code = p.transaction_code 
            LIMIT 1
          ),
          (
            SELECT c.id 
            FROM cart c 
            WHERE c.user_id = p.user_id 
              AND c.product_id = p.product_id 
            ORDER BY ABS(TIMESTAMPDIFF(SECOND, c.updated_at, p.created_at)) ASC
            LIMIT 1
          )
        ) AS cart_id
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

/**
 * remove: API xóa bản ghi lịch sử giao dịch khỏi cơ sở dữ liệu (DELETE /api/payments/:payment_id).
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
