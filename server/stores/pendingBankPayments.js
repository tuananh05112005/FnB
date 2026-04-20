const pendingPayments = new Map();

function createPendingPayment(paymentData, expiresInMs = 10 * 60 * 1000) {
  const id = `pbp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  const record = {
    id,
    ...paymentData,
    status: "pending",
    createdAt: now,
    expiresAt: now + expiresInMs,
    confirmedAt: null,
    finalizedAt: null,
  };

  pendingPayments.set(id, record);
  return record;
}

function getPendingPayment(id) {
  const record = pendingPayments.get(id);
  if (!record) return null;

  if (record.status === "pending" && Date.now() > record.expiresAt) {
    record.status = "expired";
    pendingPayments.set(id, record);
  }

  return record;
}

function updatePendingPayment(id, updater) {
  const record = getPendingPayment(id);
  if (!record) return null;

  const nextRecord = typeof updater === "function" ? updater(record) : { ...record, ...updater };
  pendingPayments.set(id, nextRecord);
  return nextRecord;
}

function listPendingPayments() {
  return Array.from(pendingPayments.values())
    .map((record) => getPendingPayment(record.id))
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function removePendingPayment(id) {
  return pendingPayments.delete(id);
}

module.exports = {
  createPendingPayment,
  getPendingPayment,
  updatePendingPayment,
  listPendingPayments,
  removePendingPayment,
};
