const { getDB, getQuery } = require("../config/db");
const {
  createPendingPayment,
  getPendingPayment,
  updatePendingPayment,
  listPendingPayments,
} = require("../stores/pendingBankPayments");

async function persistPayment(query, paymentData) {
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
  } = paymentData;

  if (use_points) {
    await query("UPDATE users SET points = 0 WHERE id = ?", [user_id]);
  }

  if (voucher_id) {
    await query("UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?", [voucher_id]);
  }

  const result = await query(
    "INSERT INTO payments (user_id, product_id, name, address, phone, payment_method, amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [user_id, product_id, name, address, phone, payment_method, amount]
  );

  await query("UPDATE cart SET status = 'completed' WHERE user_id = ? AND product_id = ?", [
    user_id,
    product_id,
  ]);

  const pointsEarned = Math.floor(amount / 10000);
  await query("UPDATE users SET points = points + ? WHERE id = ?", [pointsEarned, user_id]);

  return result;
}

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

    if (payment_method === "banking" && generateQR) {
      const users = await query("SELECT email FROM users WHERE id = ?", [user_id]);
      const pendingPayment = createPendingPayment({
        user_id,
        product_id,
        name,
        address,
        phone,
        payment_method,
        amount,
        voucher_id,
        use_points,
        email: users[0]?.email || "",
      });

      const qrUrl = `https://img.vietqr.io/image/NAB-410129237100001-compact.png?amount=${amount}&addInfo=${encodeURIComponent(
        `Thanh toan don hang ${pendingPayment.id}`
      )}&accountName=HUYNH%20NGUYEN%20TUAN%20ANH`;

      return res.status(200).json({
        message: "Tao ma QR thanh cong",
        qrUrl,
        pendingPaymentId: pendingPayment.id,
        expiresAt: pendingPayment.expiresAt,
        status: pendingPayment.status,
      });
    }

    const result = await persistPayment(query, {
      user_id,
      product_id,
      name,
      address,
      phone,
      payment_method,
      amount,
      voucher_id,
      use_points,
    });

    res.status(201).json({
      message: "Tao thanh toan thanh cong",
      orderId: result.insertId,
    });
  } catch (err) {
    console.error("Loi khi tao thanh toan:", err);
    res.status(500).send("Loi server");
  }
};

exports.getBankingStatus = (req, res) => {
  const { pending_payment_id } = req.params;
  const pendingPayment = getPendingPayment(pending_payment_id);

  if (!pendingPayment) {
    return res.status(404).json({ message: "Khong tim thay yeu cau thanh toan" });
  }

  res.json({
    id: pendingPayment.id,
    status: pendingPayment.status,
    expiresAt: pendingPayment.expiresAt,
    confirmedAt: pendingPayment.confirmedAt,
    finalizedAt: pendingPayment.finalizedAt,
  });
};

exports.finalizeBankingPayment = async (req, res) => {
  const { pending_payment_id } = req.body;
  const pendingPayment = getPendingPayment(pending_payment_id);

  if (!pendingPayment) {
    return res.status(404).json({ message: "Khong tim thay yeu cau thanh toan" });
  }

  if (pendingPayment.status === "expired") {
    return res.status(400).json({ message: "Phien thanh toan da het han" });
  }

  if (pendingPayment.status === "pending") {
    return res.status(400).json({ message: "Ban chua thanh toan" });
  }

  if (pendingPayment.status === "finalized") {
    return res.status(200).json({
      message: "Thanh toan da duoc ghi nhan truoc do",
      orderId: pendingPayment.orderId,
    });
  }

  try {
    const query = getQuery();
    const result = await persistPayment(query, pendingPayment);

    updatePendingPayment(pending_payment_id, (record) => ({
      ...record,
      status: "finalized",
      finalizedAt: Date.now(),
      orderId: result.insertId,
    }));

    res.status(201).json({
      message: "Da ghi nhan thanh toan",
      orderId: result.insertId,
    });
  } catch (err) {
    console.error("Loi khi ghi nhan thanh toan banking:", err);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.adminList = (_req, res) => {
  const db = getDB();
  const q = `
    SELECT payments.*, users.email
    FROM payments
    JOIN users ON payments.user_id = users.id
    ORDER BY payments.id DESC
  `;

  db.query(q, (err, results) => {
    if (err) return res.status(500).send("Loi server");
    res.json(results);
  });
};

exports.adminListPending = (_req, res) => {
  const pendingPayments = listPendingPayments()
    .filter((payment) => ["pending", "confirmed"].includes(payment.status))
    .map((payment) => ({
      id: payment.id,
      email: payment.email || "",
      name: payment.name,
      address: payment.address,
      amount: payment.amount,
      payment_method: payment.payment_method,
      status: payment.status,
      created_at: payment.createdAt,
      expires_at: payment.expiresAt,
      confirmed_at: payment.confirmedAt,
      user_id: payment.user_id,
      product_id: payment.product_id,
    }));

  res.json(pendingPayments);
};

exports.adminConfirmPending = (req, res) => {
  const { id } = req.params;
  const pendingPayment = getPendingPayment(id);

  if (!pendingPayment) {
    return res.status(404).json({ message: "Khong tim thay thanh toan cho xac nhan" });
  }

  if (pendingPayment.status === "expired") {
    return res.status(400).json({ message: "Phien thanh toan da het han" });
  }

  if (pendingPayment.status === "finalized") {
    return res.status(400).json({ message: "Thanh toan da duoc hoan tat" });
  }

  const updated = updatePendingPayment(id, (record) => ({
    ...record,
    status: "confirmed",
    confirmedAt: Date.now(),
  }));

  res.json({
    message: "Da xac nhan da nhan tien",
    payment: {
      id: updated.id,
      status: updated.status,
      confirmedAt: updated.confirmedAt,
    },
  });
};

exports.historyByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = getQuery();
    const payments = await query(
      `
      SELECT
        p.id AS payment_id,
        pr.name AS product_name,
        pr.image,
        pr.price,
        p.amount,
        p.payment_method,
        p.order_date,
        pr.size
      FROM payments p
      JOIN products pr ON p.product_id = pr.id
      WHERE p.user_id = ?
      ORDER BY p.order_date DESC
      `,
      [user_id]
    );

    res.json(payments);
  } catch (err) {
    console.error("Loi khi lay lich su thanh toan:", err);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.adminDelete = (req, res) => {
  const db = getDB();
  const id = req.params.id;

  db.query("DELETE FROM payments WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send("Loi server");
    res.status(200).json({ message: "Xoa thanh toan thanh cong" });
  });
};

exports.remove = async (req, res) => {
  const { payment_id } = req.params;

  try {
    const query = getQuery();
    const result = await query("DELETE FROM payments WHERE id = ?", [payment_id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Khong tim thay thanh toan can xoa" });
    }

    res.json({ message: "Xoa thanh toan thanh cong" });
  } catch (err) {
    console.error("Loi khi xoa thanh toan:", err);
    res.status(500).json({ message: "Loi server" });
  }
};
