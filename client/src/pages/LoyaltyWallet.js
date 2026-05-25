import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaTicketAlt, FaStar, FaBell, FaPaperPlane,
  FaSave, FaGift, FaInfinity,
} from "react-icons/fa";
import "../styles/dashboard.css";


const fmt = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(v || 0);

const BASE = "http://localhost:5000";

const LoyaltyWallet = () => {
  const [points,        setPoints]        = useState(0);
  const [vouchers,      setVouchers]      = useState([]);
  const [allVouchers,   setAllVouchers]   = useState([]);
  const [users,         setUsers]         = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [newVoucher,    setNewVoucher]    = useState({
    code: "", discount_type: "percent", discount_value: "",
    min_order: "", usage_limit: "", expired_at: null,
  });
  const [toast, setToast] = useState("");

  const user_id = localStorage.getItem("user_id");
  const role    = localStorage.getItem("role");

  useEffect(() => {
    if (role === "admin") {
      axios.get(`${BASE}/api/users/all`).then((r) => setUsers(r.data)).catch(console.error);
      axios.get(`${BASE}/api/vouchers`).then((r) => setAllVouchers(r.data || [])).catch(console.error);
    } else if (user_id) {
      axios.get(`${BASE}/api/loyalty/${user_id}`).then((r) => {
        setPoints(r.data.points);
        setVouchers(r.data.vouchers || []);
        setNotifications(r.data.notifications || []);
      }).catch(console.error);
    }
  }, [user_id, role]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleAssign = async (voucherId) => {
    try {
      await axios.post(`${BASE}/api/vouchers/assign`, {
        voucher_id: voucherId,
        user_ids: selectedUsers.length > 0 ? selectedUsers : [],
      });
      showToast("Gửi voucher thành công! 🎉");
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    try {
      await axios.post(`${BASE}/api/vouchers`, newVoucher);
      showToast("Tạo voucher thành công! ✅");
      setNewVoucher({ code: "", discount_type: "percent", discount_value: "", min_order: "", usage_limit: "", expired_at: null });
      const r = await axios.get(`${BASE}/api/vouchers`);
      setAllVouchers(r.data || []);
    } catch (err) { console.error(err); }
  };

  const patch = (field, val) => setNewVoucher((p) => ({ ...p, [field]: val }));

  const discountBadge = (type) => type === "percent"
    ? { label: "Giảm %",    cls: "dashboard-badge-info" }
    : { label: "Giảm tiền", cls: "dashboard-badge-success" };

  /* ── Progress bar points ── */
  const NEXT_TIER = 500;
  const progress = Math.min(100, Math.round((points / NEXT_TIER) * 100));

  return (
    <div className="dashboard-page">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 9999,
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", padding: "12px 20px",
          boxShadow: "var(--shadow-lg)", fontSize: "0.9rem", fontWeight: 600,
          color: "var(--color-success)", animation: "fadeInDown 0.3s ease",
        }}>
          {toast}
        </div>
      )}

      <div className="dashboard-shell">
        {/* Header */}
        <div className="dashboard-header animate-fadeInUp">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon">{role === "admin" ? <FaTicketAlt /> : <FaStar />}</div>
            <div>
              <h1 className="dashboard-title">{role === "admin" ? "Quản lý Voucher" : "Ví tích điểm"}</h1>
              <p className="dashboard-subtitle">{role === "admin" ? "Tạo và phân phát voucher tới người dùng" : "Điểm thưởng và voucher ưu đãi của bạn"}</p>
            </div>
          </div>
        </div>

        {role !== "admin" ? (
          /* ─── USER VIEW ─── */
          <>
            {/* Points card — wide layout, lighter colors */}
            <div className="animate-fadeInUp" style={{
              background: "linear-gradient(135deg, var(--color-brand-pale) 0%, #FFF3CC 60%, #FFE0A0 100%)",
              border: "1.5px solid var(--color-brand)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-6) var(--space-8)",
              position: "relative", overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}>
              {/* Soft decorative circles */}
              <div style={{ position: "absolute", right: -20, top: -20, width: 180, height: 180, borderRadius: "50%", background: "rgba(200,134,10,0.08)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", right: 40, bottom: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(200,134,10,0.05)", pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-brand-dark)", opacity: 0.7 }}>
                  ⭐ Điểm tích lũy
                </p>
                <p style={{ margin: "0 0 20px", fontFamily: "var(--app-font-display)", fontSize: "3rem", fontWeight: 900, color: "var(--color-brand-dark)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {points} <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--color-brand)", opacity: 0.7 }}>điểm</span>
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-brand-dark)", fontWeight: 600 }}>Đến hạng tiếp theo</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-brand-dark)", fontWeight: 800 }}>{points}/{NEXT_TIER}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: "rgba(157,98,8,0.15)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: "linear-gradient(90deg, var(--color-brand), var(--color-brand-dark))", transition: "width 1s ease" }} />
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-brand-dark)", opacity: 0.65 }}>
                  Còn {NEXT_TIER - points} điểm để lên hạng Gold 🏆
                </p>
              </div>
            </div>



            {/* Vouchers */}
            <section className="dashboard-panel animate-fadeInUp animate-delay-1">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">🎫 Voucher của bạn</h2>
                <span className="dashboard-count">{vouchers.length} voucher</span>
              </div>
              {vouchers.length === 0 ? (
                <div className="dashboard-empty">
                  <div style={{ fontSize: "2.5rem", opacity: 0.2 }}>🎁</div>
                  <h3>Chưa có voucher nào</h3>
                  <p>Mua hàng và tích điểm để nhận voucher ưu đãi!</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-4)", padding: "var(--space-5)" }}>
                  {vouchers.map((v) => {
                    const b = discountBadge(v.discount_type);
                    return (
                      <div key={v.id} style={{
                        border: "2px dashed var(--color-brand)",
                        borderRadius: "var(--radius-lg)", padding: "var(--space-5)",
                        background: "var(--color-brand-pale)", position: "relative", overflow: "hidden",
                      }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>🎫</div>
                        <div style={{ fontFamily: "var(--app-font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--color-brand-dark)", letterSpacing: "0.05em", marginBottom: 6 }}>
                          {v.code}
                        </div>
                        <span className={`dashboard-badge ${b.cls}`} style={{ marginBottom: 8, display: "inline-flex" }}>{b.label}</span>
                        <div style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "0.95rem" }}>
                          {v.discount_type === "percent" ? `Giảm ${v.discount_value}%` : `Giảm ${fmt(v.discount_value)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Notifications */}
            <section className="dashboard-panel animate-fadeInUp animate-delay-2">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">🔔 Thông báo</h2>
              </div>
              {notifications.length === 0 ? (
                <div className="dashboard-empty">
                  <div style={{ fontSize: "2.5rem", opacity: 0.2 }}>🔔</div>
                  <p>Không có thông báo nào</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => (
                    <div key={n.id} style={{
                      display: "flex", justifyContent: "space-between", gap: "var(--space-3)",
                      padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--color-border-light)",
                      transition: "background var(--transition-fast)",
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg-alt)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = ""}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text)" }}>{n.message}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-text-faint)", whiteSpace: "nowrap" }}>
                        {new Date(n.created_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>

        ) : (
          /* ─── ADMIN VIEW ─── */
          <>
            {/* Voucher list */}
            <section className="dashboard-panel animate-fadeInUp">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">🎫 Danh sách voucher</h2>
                <span className="dashboard-count">{allVouchers.length} voucher</span>
              </div>
              {allVouchers.length === 0 ? (
                <div className="dashboard-empty">
                  <div style={{ fontSize: "2.5rem", opacity: 0.2 }}>🎫</div>
                  <p>Chưa có voucher nào</p>
                </div>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table dashboard-table-compact">
                    <thead>
                      <tr>
                        <th>#</th><th>Mã</th><th>Loại</th><th>Giá trị</th>
                        <th>Đơn tối thiểu</th><th>Số lần</th><th>Hạn dùng</th><th>Gửi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allVouchers.map((v, i) => {
                        const b = discountBadge(v.discount_type);
                        return (
                          <tr key={v.id}>
                            <td className="dashboard-index">{String(i + 1).padStart(2, "0")}</td>
                            <td>
                              <span style={{
                                background: "var(--color-brand-pale)", color: "var(--color-brand-dark)",
                                fontWeight: 800, fontSize: "0.8rem", padding: "3px 10px",
                                borderRadius: "var(--radius-sm)", border: "1px dashed var(--color-brand)",
                                fontFamily: "monospace", letterSpacing: "0.05em",
                              }}>{v.code}</span>
                            </td>
                            <td><span className={`dashboard-badge ${b.cls}`}>{b.label}</span></td>
                            <td style={{ fontWeight: 700 }}>{v.discount_type === "percent" ? `${v.discount_value}%` : fmt(v.discount_value)}</td>
                            <td className="dashboard-muted">{fmt(v.min_order)}</td>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>{v.usage_limit}</td>
                            <td className="dashboard-muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                              {v.expired_at
                                ? new Date(v.expired_at).toLocaleDateString("vi-VN")
                                : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FaInfinity size={11} /> Không giới hạn</span>}
                            </td>
                            <td>
                              <button className="dashboard-btn dashboard-btn-secondary" style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                                onClick={() => handleAssign(v.id)}>
                                <FaPaperPlane size={10} /> Gửi
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Select recipients */}
            <section className="dashboard-panel animate-fadeInUp animate-delay-1">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">👥 Người nhận voucher</h2>
              </div>
              <div className="dashboard-panel-body">
                <div className="dashboard-field">
                  <label>Chọn người dùng (Ctrl/Cmd để chọn nhiều)</label>
                  <select multiple className="dashboard-select" style={{ height: 120 }}
                    value={selectedUsers}
                    onChange={(e) => {
                      const vals = Array.from(e.target.selectedOptions, (o) => o.value);
                      setSelectedUsers(vals.includes("all") ? [] : vals);
                    }}>
                    <option value="all">— Gửi tất cả —</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Create voucher */}
            <section className="dashboard-panel animate-fadeInUp animate-delay-2">
              <div className="dashboard-panel-header">
                <h2 className="dashboard-panel-title">✨ Tạo voucher mới</h2>
              </div>
              <div className="dashboard-panel-body">
                <div className="dashboard-form-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                  <div className="dashboard-field">
                    <label>Mã voucher</label>
                    <input className="dashboard-input" placeholder="VD: SALE50" value={newVoucher.code} onChange={(e) => patch("code", e.target.value)} />
                  </div>
                  <div className="dashboard-field">
                    <label>Loại giảm</label>
                    <select className="dashboard-select" value={newVoucher.discount_type} onChange={(e) => patch("discount_type", e.target.value)}>
                      <option value="percent">Giảm %</option>
                      <option value="amount">Giảm tiền</option>
                    </select>
                  </div>
                  <div className="dashboard-field">
                    <label>Giá trị</label>
                    <input className="dashboard-input" type="number" placeholder="VD: 20" value={newVoucher.discount_value} onChange={(e) => patch("discount_value", e.target.value)} />
                  </div>
                  <div className="dashboard-field">
                    <label>Đơn tối thiểu</label>
                    <input className="dashboard-input" type="number" placeholder="VD: 200000" value={newVoucher.min_order} onChange={(e) => patch("min_order", e.target.value)} />
                  </div>
                  <div className="dashboard-field">
                    <label>Số lần dùng</label>
                    <input className="dashboard-input" type="number" placeholder="VD: 10" value={newVoucher.usage_limit} onChange={(e) => patch("usage_limit", e.target.value)} />
                  </div>
                  <div className="dashboard-field">
                    <label>Hạn sử dụng</label>
                    <input className="dashboard-input" type="date" value={newVoucher.expired_at ? newVoucher.expired_at.split("T")[0] : ""} onChange={(e) => patch("expired_at", e.target.value)} />
                  </div>
                </div>
                <div className="dashboard-form-actions">
                  <button className="dashboard-btn dashboard-btn-primary" onClick={handleCreate}>
                    <FaSave size={13} /> Lưu voucher
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default LoyaltyWallet;
