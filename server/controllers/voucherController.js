const { getQuery } = require("../config/db");

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
      }
    }

    res.json({ success: true, assigned: targetUsers.length });
  } catch (err) {
    console.error("Loi assign voucher:", err);
    res.status(500).json({ error: "Assign voucher that bai" });
  }
};
