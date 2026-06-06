// ==============================================================
// TÊN FILE: voucherController.js
// MÔ TẢ: Controller quản lý hệ thống Voucher khuyến mãi của cửa hàng.
//        Thực hiện nghiệp vụ: tạo mới voucher (Admin), danh sách voucher còn hiệu lực,
//        khách hàng đổi điểm tích lũy lấy voucher (redeem), kiểm tra tính hợp lệ của voucher (validate),
//        và phân phát voucher cho nhóm khách hàng (assign) kèm phát socket.io real-time.
// ==============================================================

const { getQuery } = require("../config/db");

/**
 * create: API tạo mới mã voucher vào hệ thống (POST /api/vouchers).
 */
exports.create = async (req, res) => {
  const { code, discount_type, discount_value, min_order, expired_at, usage_limit } =
    req.body;

  try {
    const query = getQuery();
    await query(
      "INSERT INTO vouchers (code, discount_type, discount_value, min_order, expired_at, usage_limit) VALUES (?, ?, ?, ?, ?, ?)",
      [code, discount_type, discount_value, min_order, expired_at, usage_limit]
    );

    res.json({ message: "Tao voucher thanh cong" });
  } catch (err) {
    console.error("Loi tao voucher:", err);
    res.status(500).json({ error: "Loi server" });
  }
};

/**
 * listValid: API lấy danh sách các mã voucher còn hạn sử dụng và chưa hết số lượt dùng (GET /api/vouchers).
 */
exports.listValid = async (_req, res) => {
  try {
    const query = getQuery();
    const vouchers = await query(
      "SELECT * FROM vouchers WHERE expired_at > NOW() AND used_count < usage_limit"
    );

    res.json(vouchers);
  } catch (err) {
    console.error("Loi lay voucher:", err);
    res.status(500).json({ error: "Loi server" });
  }
};

/**
 * redeem: API cho phép khách hàng dùng điểm tích lũy để đổi lấy mã voucher (POST /api/vouchers/redeem).
 * Trừ điểm của khách hàng, tạo một voucher cá nhân mới có hạn dùng trong 7 ngày tiếp theo.
 */
exports.redeem = async (req, res) => {
  const { user_id, pointsRequired, code, discount_type, discount_value } = req.body;

  try {
    const query = getQuery();
    const [user] = await query("SELECT points FROM users WHERE id = ?", [user_id]);

    if (!user || user.points < pointsRequired) {
      return res.status(400).json({ error: "Khong du diem" });
    }

    await query("UPDATE users SET points = points - ? WHERE id = ?", [
      pointsRequired,
      user_id,
    ]);
    await query(
      "INSERT INTO vouchers (code, discount_type, discount_value, min_order, expired_at, usage_limit) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 1)",
      [code, discount_type, discount_value, 0]
    );

    res.json({ message: "Doi diem lay voucher thanh cong" });
  } catch (err) {
    console.error("Loi doi diem:", err);
    res.status(500).json({ error: "Loi server" });
  }
};

/**
 * validate: API kiểm tra tính hợp lệ của mã voucher khi khách áp dụng lúc đặt hàng (POST /api/vouchers/validate).
 */
exports.validate = async (req, res) => {
  const { code } = req.body;

  try {
    const query = getQuery();
    const rows = await query(
      `SELECT * FROM vouchers
       WHERE code = ?
       AND (expired_at IS NULL OR expired_at > NOW())
       AND used_count < usage_limit`,
      [code]
    );

    if (!rows.length) {
      return res.json({ valid: false, message: "Voucher khong hop le hoac da het han" });
    }

    res.json({ valid: true, voucher: rows[0] });
  } catch (err) {
    console.error("Loi validate voucher:", err);
    res.status(500).json({ valid: false, message: "Loi server" });
  }
};

/**
 * assign: API gán/phân phát voucher cho người dùng cụ thể hoặc toàn bộ khách hàng (POST /api/vouchers/assign).
 * Nếu mảng user_ids trống hoặc không được gửi lên, hệ thống tự động gán cho toàn bộ các tài khoản khách hàng.
 * Lưu vào bảng user_vouchers, tạo thông báo hệ thống và phát socket 'newVoucher' tới thiết bị khách hàng.
 */
exports.assign = async (req, res) => {
  const { voucher_id, user_ids } = req.body;

  try {
    const query = getQuery();
    let targetUsers = [];

    const voucherRows = await query("SELECT code FROM vouchers WHERE id = ?", [voucher_id]);
    if (!voucherRows.length) {
      return res.status(404).json({ error: "Voucher khong ton tai" });
    }

    const voucherCode = voucherRows[0].code;

    if (!user_ids || !user_ids.length) {
      const rows = await query("SELECT id FROM users WHERE role = 'user'");
      targetUsers = rows.map((row) => row.id);
    } else {
      targetUsers = user_ids;
    }

    for (const uid of targetUsers) {
      const existed = await query(
        "SELECT * FROM user_vouchers WHERE user_id = ? AND voucher_id = ?",
        [uid, voucher_id]
      );

      if (!existed.length) {
        await query("INSERT INTO user_vouchers (user_id, voucher_id) VALUES (?, ?)", [
          uid,
          voucher_id,
        ]);
        await query("INSERT INTO notifications (user_id, message) VALUES (?, ?)", [
          uid,
          `Ban vua nhan duoc voucher ${voucherCode}`,
        ]);
        if (global.io) {
          global.io.to(`user:${uid}`).emit("newVoucher", {
            message: `Bạn vừa nhận được voucher ${voucherCode}`,
            voucherCode: voucherCode
          });
        }
      }
    }

    res.json({ success: true, assigned: targetUsers.length });
  } catch (err) {
    console.error("Loi assign voucher:", err);
    res.status(500).json({ error: "Assign voucher that bai" });
  }
};
