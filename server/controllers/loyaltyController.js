const { getQuery } = require("../config/db");

exports.addPoints = async (req, res) => {
  const { user_id, amount } = req.body;

  try {
    const query = getQuery();
    const pointsEarned = Math.floor(amount / 10000);

    await query("UPDATE users SET points = points + ? WHERE id = ?", [
      pointsEarned,
      user_id,
    ]);

    res.json({ message: "Da cong diem", pointsEarned });
  } catch (err) {
    console.error("Loi cong diem:", err);
    res.status(500).json({ error: "Loi cong diem" });
  }
};

exports.wallet = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = getQuery();

    const pointsRes = await query("SELECT points FROM users WHERE id = ?", [user_id]);
    const points = pointsRes.length ? pointsRes[0].points : 0;

    const vouchers = await query(
      `SELECT v.*
       FROM vouchers v
       JOIN user_vouchers uv ON uv.voucher_id = v.id
       WHERE uv.user_id = ?`,
      [user_id]
    );

    const notifications = await query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
      [user_id]
    );

    res.json({ points, vouchers, notifications });
  } catch (err) {
    console.error("Loi API /api/loyalty:", err);
    res.status(500).json({ error: "Loi server khi lay vi tich diem" });
  }
};

exports.markNotificationsRead = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = getQuery();
    await query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [user_id]);

    res.json({
      success: true,
      message: "Da danh dau da doc",
    });
  } catch (err) {
    console.error("Loi update notification:", err);
    res.status(500).json({ error: "Loi server" });
  }
};
