import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt, FaCreditCard, FaEye, FaHistory,
  FaMoneyBill, FaShoppingBag, FaTrash, FaSearch,
  FaFilter, FaTimes, FaReceipt, FaChartLine,
} from "react-icons/fa";

import { api } from "../lib/api";
import { getUserId } from "../lib/session";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(Number(n) || 0);

const STATUS_CFG = {
  pending:   { label: "Đang xử lý", cls: "dashboard-badge-warning", dot: "#f59e0b" },
  completed: { label: "Đang giao",  cls: "dashboard-badge-info",    dot: "#2563eb" },
  received:  { label: "Đã giao",    cls: "dashboard-badge-success", dot: "#16a34a" },
  cancelled: { label: "Đã hủy",     cls: "dashboard-badge-danger",  dot: "#ef4444" },
};

const METHOD_CFG = {
  cash:    { icon: <FaMoneyBill />,   label: "Tiền mặt",      cls: "dashboard-badge-warning", color: "#f59e0b", bg: "#fff7ed" },
  banking: { icon: <FaCreditCard />,  label: "Chuyển khoản",  cls: "dashboard-badge-neutral", color: "#64748b", bg: "#f8fafc" },
};

const getMethod = (m) => METHOD_CFG[m] || METHOD_CFG.banking;
const getStatus = (s) => STATUS_CFG[s] || STATUS_CFG.pending;

const History = () => {
  const navigate = useNavigate();
  const userId   = getUserId();

  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all"); // payment method
  const [viewMode, setViewMode] = useState("card"); // "card" | "table"

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const res = await api.get(`/api/payments/history/${userId}`);
        setHistory(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("History load error:", e);
        setError("Không thể tải lịch sử giao dịch lúc này.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleDelete = async (paymentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
    try {
      await api.delete(`/api/payments/${paymentId}`);
      setHistory((prev) => prev.filter((item) => item.payment_id !== paymentId));
    } catch (e) {
      setError("Không thể xóa giao dịch này.");
    }
  };

  // Totals
  const totalAmount  = useMemo(() => history.reduce((s, i) => s + Number(i.amount || 0), 0), [history]);
  const cashOrders   = useMemo(() => history.filter((i) => i.payment_method === "cash"), [history]);
  const bankOrders   = useMemo(() => history.filter((i) => i.payment_method !== "cash"), [history]);

  // Filtered list
  const displayed = useMemo(() => {
    let list = [...history];
    if (filter !== "all") list = list.filter((i) => i.payment_method === filter);
    if (search.trim())    list = list.filter((i) =>
      (i.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(i.payment_id).includes(search)
    );
    return list;
  }, [history, filter, search]);

  // Group by date for card view
  const grouped = useMemo(() => {
    const map = {};
    displayed.forEach((item) => {
      const date = new Date(item.order_date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      if (!map[date]) map[date] = [];
      map[date].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [displayed]);

  const statCards = [
    { label: "Tổng giao dịch", value: history.length,          icon: <FaShoppingBag />, accent: "#7c3aed", bg: "#f5f3ff", color: "#7c3aed" },
    { label: "Tổng chi tiêu",  value: fmt(totalAmount),         icon: <FaChartLine />,   accent: "#10b981", bg: "#ecfdf3", color: "#10b981" },
    { label: "Tiền mặt",       value: cashOrders.length + " đơn", icon: <FaMoneyBill />, accent: "#f59e0b", bg: "#fff7ed", color: "#f59e0b" },
    { label: "Chuyển khoản",   value: bankOrders.length + " đơn", icon: <FaCreditCard />,accent: "#3b82f6", bg: "#eff6ff", color: "#3b82f6" },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell" style={{ display: "grid", gap: 20 }}>

        {/* ── Header ── */}
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon"><FaHistory /></div>
            <div>
              <h1 className="dashboard-title">Lịch sử giao dịch</h1>
              <p className="dashboard-subtitle">Theo dõi tất cả đơn hàng và lịch sử thanh toán của bạn</p>
            </div>
          </div>
          <button type="button" className="dashboard-back-btn" onClick={() => navigate("/products")}>
            <FaShoppingBag /> Mua tiếp
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="dashboard-stats-grid">
          {statCards.map((s) => (
            <article key={s.label} className="dashboard-stat dashboard-stat-accent" style={{ "--stat-accent": s.accent }}>
              <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p className="dashboard-stat-value" style={{ fontSize: "1.5rem" }}>{s.value}</p>
                <p className="dashboard-stat-label">{s.label}</p>
              </div>
            </article>
          ))}
        </div>

        {/* ── Total banner ── */}
        <section className="dashboard-panel dashboard-panel-dark">
          <div className="dashboard-panel-body">
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div className="dashboard-stat-icon" style={{ background: "rgba(255,255,255,0.14)", color: "#c7d2fe", width: 56, height: 56, fontSize: "1.3rem" }}>
                <FaReceipt />
              </div>
              <div>
                <p className="dashboard-stat-label" style={{ color: "rgba(226,232,240,0.7)" }}>TỔNG CHI TIÊU</p>
                <p className="dashboard-title" style={{ color: "#fff", margin: 0, letterSpacing: "-0.04em" }}>{fmt(totalAmount)}</p>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <p style={{ color: "rgba(226,232,240,0.6)", fontSize: "0.8rem", margin: 0 }}>Từ {history.length} giao dịch</p>
                <p style={{ color: "#a5f3fc", fontWeight: 800, fontSize: "0.9rem", margin: "4px 0 0" }}>
                  TB {history.length ? fmt(Math.round(totalAmount / history.length)) : "—"} / đơn
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Toolbar: search + filter + view toggle ── */}
        <div className="dashboard-toolbar">
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8aa0c5", fontSize: 13 }} />
              <input
                className="dashboard-input"
                style={{ paddingLeft: 36, borderRadius: 12 }}
                placeholder="Tìm tên sản phẩm hoặc mã đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <button type="button" className="dashboard-btn dashboard-btn-ghost" onClick={() => setSearch("")}>
                <FaTimes />
              </button>
            )}
          </div>

          {/* Method filter */}
          <div className="dashboard-toolbar-group">
            {[
              { key: "all",     label: "Tất cả" },
              { key: "cash",    label: "Tiền mặt" },
              { key: "banking", label: "Chuyển khoản" },
            ].map((f) => (
              <button key={f.key} type="button"
                className={`dashboard-chip ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="dashboard-toolbar-group">
            <button type="button"
              className={`dashboard-chip ${viewMode === "card" ? "active" : ""}`}
              onClick={() => setViewMode("card")}
              title="Dạng thẻ"
            >⊞ Thẻ</button>
            <button type="button"
              className={`dashboard-chip ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Dạng bảng"
            >☰ Bảng</button>
          </div>

          <span className="dashboard-count">{displayed.length} kết quả</span>
        </div>

        {error && <div className="commerce-alert commerce-alert-danger">{error}</div>}

        {/* ── Content ── */}
        {loading ? (
          <section className="dashboard-panel">
            <div className="dashboard-empty">Đang tải lịch sử giao dịch...</div>
          </section>
        ) : displayed.length === 0 ? (
          <section className="dashboard-panel">
            <div className="dashboard-empty">
              <div className="commerce-empty-icon"><FaHistory /></div>
              <h3>Chưa có giao dịch nào</h3>
              <p>Bạn có thể đặt đơn mới từ trang sản phẩm.</p>
            </div>
          </section>
        ) : viewMode === "card" ? (

          /* ── Card / Timeline view ── */
          <div style={{ display: "grid", gap: 24 }}>
            {grouped.map(([date, items]) => (
              <div key={date}>
                {/* Date separator */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#eef2ff", borderRadius: 999, padding: "5px 14px",
                    fontSize: "0.78rem", fontWeight: 800, color: "#4338ca",
                  }}>
                    <FaCalendarAlt size={11} /> {date}
                  </div>
                  <div style={{ flex: 1, height: 1, background: "#e8edff" }} />
                  <span className="dashboard-count">{items.length} đơn</span>
                </div>

                {/* Cards */}
                <div style={{ display: "grid", gap: 12 }}>
                  {items.map((item) => {
                    const method = getMethod(item.payment_method);
                    const status = getStatus(item.status);
                    return (
                      <div key={item.payment_id} className="dashboard-panel" style={{
                        display: "grid",
                        gridTemplateColumns: "72px 1fr auto",
                        gap: 16, padding: 0, overflow: "hidden",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(15,23,42,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                      >
                        {/* Thumbnail */}
                        <div style={{ background: "#f8f9ff", display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1/1" }}>
                          <img
                            src={item.image || "https://via.placeholder.com/72"}
                            alt={item.product_name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.src = "https://via.placeholder.com/72"; }}
                          />
                        </div>

                        {/* Info */}
                        <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                            {item.product_name || "Sản phẩm"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span className={`dashboard-badge ${method.cls}`} style={{ fontSize: "0.72rem" }}>
                              {method.label}
                            </span>
                            {item.status && (
                              <span className={`dashboard-badge ${status.cls}`} style={{ fontSize: "0.72rem" }}>
                                {status.label}
                              </span>
                            )}
                            <span className="dashboard-code" style={{ fontSize: "0.72rem" }}>
                              #{item.payment_id}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#8aa0c5" }}>
                            {new Date(item.order_date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>

                        {/* Amount + actions */}
                        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 10, borderLeft: "1px solid #f1f5f9" }}>
                          <span style={{
                            fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.03em",
                            background: "linear-gradient(135deg,#7c3aed,#4338ca)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                          }}>
                            {fmt(item.amount)}
                          </span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button"
                              className="dashboard-btn dashboard-btn-secondary"
                              style={{ padding: "6px 12px", fontSize: "0.78rem", borderRadius: 10 }}
                              onClick={() => navigate("/order-detail", { state: { order: item } })}
                            >
                              <FaEye /> Xem
                            </button>
                            <button type="button"
                              className="dashboard-btn dashboard-btn-danger"
                              style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: 10 }}
                              onClick={() => handleDelete(item.payment_id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* ── Table view ── */
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <h2 className="dashboard-panel-title">
                <span className="dashboard-panel-title-dot" />
                Danh sách giao dịch
              </h2>
              <span className="dashboard-count">{displayed.length} kết quả</span>
            </div>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th>Hình thức</th>
                    <th>Trạng thái</th>
                    <th>Số tiền</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((item, i) => {
                    const method = getMethod(item.payment_method);
                    const status = getStatus(item.status);
                    return (
                      <tr key={item.payment_id}>
                        <td className="dashboard-index">{String(i + 1).padStart(2, "0")}</td>
                        <td>
                          <div className="dashboard-product">
                            <img
                              src={item.image || "https://via.placeholder.com/68"}
                              alt={item.product_name}
                              className="dashboard-thumb"
                              onError={(e) => { e.target.src = "https://via.placeholder.com/68"; }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.product_name || "Sản phẩm"}</div>
                              <span className="dashboard-code">#{item.payment_id}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className={`dashboard-badge ${method.cls}`}>{method.label}</span></td>
                        <td>{item.status && <span className={`dashboard-badge ${status.cls}`}>{status.label}</span>}</td>
                        <td className="dashboard-money-primary">{fmt(item.amount)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#334155" }}>
                            <FaCalendarAlt style={{ color: "#94a3b8", fontSize: 12 }} />
                            {new Date(item.order_date).toLocaleString("vi-VN")}
                          </div>
                        </td>
                        <td>
                          <div className="dashboard-action-row">
                            <button type="button"
                              className="dashboard-btn dashboard-btn-secondary"
                              onClick={() => navigate("/order-detail", { state: { order: item } })}
                            ><FaEye /> Xem</button>
                            <button type="button"
                              className="dashboard-btn dashboard-btn-danger"
                              onClick={() => handleDelete(item.payment_id)}
                            ><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default History;
