import { useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import vi from "date-fns/locale/vi";
import {
  FaArrowLeft, FaBoxOpen, FaCalendarAlt, FaCheckCircle,
  FaFilter, FaMoneyBillWave, FaSearch, FaTimes, FaTrash,
  FaUniversity, FaWallet, FaClipboardList, FaCreditCard,
  FaMoneyBill,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { api } from "../../lib/api";
import "../../styles/dashboard.css";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("vi", vi);

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(Number(n) || 0);

const STATUS_TABS = [
  { key: "all",       label: "Tất cả",      dot: "#8aa0c5" },
  { key: "pending",   label: "Đang xử lý",  dot: "#f59e0b" },
  { key: "completed", label: "Đang giao",   dot: "#2563eb" },
  { key: "received",  label: "Đã giao",     dot: "#16a34a" },
  { key: "cancelled", label: "Đã hủy",      dot: "#ef4444" },
];

const STATUS_BADGE = {
  pending:   { label: "Đang xử lý", cls: "dashboard-badge-warning" },
  completed: { label: "Đang giao",  cls: "dashboard-badge-info"    },
  received:  { label: "Đã giao",    cls: "dashboard-badge-success"  },
  cancelled: { label: "Đã hủy",     cls: "dashboard-badge-danger"   },
};

const getBadge = (s) => STATUS_BADGE[s] || STATUS_BADGE.pending;

const OrderList = () => {
  const navigate = useNavigate();

  const [orders,         setOrders]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeStatus,   setActiveStatus]   = useState("all");
  const [search,         setSearch]         = useState("");
  const [startDateInput, setStartDateInput] = useState(null);
  const [endDateInput,   setEndDateInput]   = useState(null);
  const [startDate,      setStartDate]      = useState(null);
  const [endDate,        setEndDate]        = useState(null);
  const [showFilter,     setShowFilter]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/admin/payments");
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Failed to load orders:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.created_at || o.order_date);
      const matchStatus = activeStatus === "all" || o.status === activeStatus;
      const matchStart  = !startDate || d >= new Date(new Date(startDate).setHours(0, 0, 0, 0));
      const matchEnd    = !endDate   || d <= new Date(new Date(endDate).setHours(23, 59, 59, 999));
      const q = search.toLowerCase();
      const matchSearch = !q || (o.email || "").toLowerCase().includes(q)
        || (o.name || "").toLowerCase().includes(q)
        || String(o.id).includes(q);
      return matchStatus && matchStart && matchEnd && matchSearch;
    });
  }, [activeStatus, endDate, orders, startDate, search]);

  const stats = useMemo(() => {
    const cash    = filteredOrders.filter((o) => o.payment_method === "cash");
    const banking = filteredOrders.filter((o) => o.payment_method !== "cash");
    return {
      total:      filteredOrders.length,
      revenue:    filteredOrders.reduce((s, o) => s + Number(o.amount || 0), 0),
      cash:       cash.length,
      banking:    banking.length,
      pending:    filteredOrders.filter((o) => o.status === "pending").length,
      completed:  filteredOrders.filter((o) => o.status === "completed").length,
      received:   filteredOrders.filter((o) => o.status === "received").length,
      cancelled:  filteredOrders.filter((o) => o.status === "cancelled").length,
    };
  }, [filteredOrders]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await api.delete(`/api/admin/payments/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      console.error("Failed to delete order:", e);
    }
  };

  const applyFilter = () => { setStartDate(startDateInput); setEndDate(endDateInput); };
  const resetFilter = () => {
    setActiveStatus("all"); setSearch("");
    setStartDate(null); setEndDate(null);
    setStartDateInput(null); setEndDateInput(null);
  };
  const hasFilter = activeStatus !== "all" || search || startDate || endDate;

  const statCards = [
    { label: "Tổng đơn",      value: stats.total,    icon: <FaBoxOpen />,       accent: "#7c3aed", bg: "#f5f3ff", color: "#7c3aed" },
    { label: "Đang xử lý",    value: stats.pending,  icon: <FaClipboardList />, accent: "#f59e0b", bg: "#fff7ed", color: "#f59e0b" },
    { label: "Đang giao",      value: stats.completed,icon: <FaUniversity />,    accent: "#3b82f6", bg: "#eff6ff", color: "#3b82f6" },
    { label: "Đã hủy",         value: stats.cancelled,icon: <FaTimes />,         accent: "#ef4444", bg: "#fef2f2", color: "#ef4444" },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell" style={{ display: "grid", gap: 20 }}>

        {/* ── Header ── */}
        <div className="dashboard-header">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon"><FaWallet size={20} /></div>
            <div>
              <h1 className="dashboard-title">Quản lý đơn hàng</h1>
              <p className="dashboard-subtitle">Theo dõi, lọc và quản lý tất cả đơn hàng trong hệ thống</p>
            </div>
          </div>
          <button type="button" className="dashboard-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>

        {/* ── Revenue hero ── */}
        <section className="dashboard-panel dashboard-panel-dark">
          <div className="dashboard-panel-body">
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div className="dashboard-stat-icon" style={{ background: "rgba(255,255,255,0.14)", color: "#c7d2fe", width: 56, height: 56, fontSize: "1.3rem" }}>
                <FaMoneyBillWave />
              </div>
              <div>
                <p className="dashboard-stat-label" style={{ color: "rgba(226,232,240,0.7)" }}>TỔNG DOANH THU (đang lọc)</p>
                <h2 className="dashboard-title" style={{ color: "#fff", margin: 0 }}>{fmt(stats.revenue)}</h2>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 24 }}>
                {[
                  { icon: <FaMoneyBill />,   label: "Tiền mặt",     value: stats.cash    + " đơn" },
                  { icon: <FaCreditCard />,   label: "Chuyển khoản", value: stats.banking + " đơn" },
                  { icon: <FaCheckCircle />,  label: "Đã giao",      value: stats.received + " đơn" },
                ].map((m) => (
                  <div key={m.label} style={{ textAlign: "center" }}>
                    <div style={{ color: "#a5b4fc", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ color: "#fff", fontWeight: 900, fontSize: "1.1rem" }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat cards ── */}
        <div className="dashboard-stats-grid">
          {statCards.map((s) => (
            <article key={s.label} className="dashboard-stat dashboard-stat-accent" style={{ "--stat-accent": s.accent }}>
              <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p className="dashboard-stat-value">{s.value}</p>
                <p className="dashboard-stat-label">{s.label}</p>
              </div>
            </article>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-body" style={{ display: "grid", gap: 14 }}>

            {/* Row 1: search + filter toggle + reset */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
                <FaSearch style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8aa0c5", fontSize: 13 }} />
                <input
                  className="dashboard-input"
                  style={{ paddingLeft: 36, borderRadius: 12 }}
                  placeholder="Tìm email, tên khách hàng hoặc mã đơn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Date filter toggle */}
              <button type="button"
                className={`dashboard-btn ${showFilter ? "dashboard-btn-primary" : "dashboard-btn-secondary"}`}
                onClick={() => setShowFilter((v) => !v)}
              >
                <FaCalendarAlt /> Lọc ngày
              </button>

              {/* Reset */}
              {hasFilter && (
                <button type="button" className="dashboard-btn dashboard-btn-danger" onClick={resetFilter}>
                  <FaTimes /> Xóa lọc
                </button>
              )}

              <span className="dashboard-count" style={{ marginLeft: "auto" }}>{filteredOrders.length} đơn hàng</span>
            </div>

            {/* Row 2: status chips */}
            <div className="dashboard-toolbar-group" style={{ flexWrap: "wrap" }}>
              {STATUS_TABS.map((tab) => (
                <button key={tab.key} type="button"
                  className={`dashboard-chip ${activeStatus === tab.key ? "active" : ""}`}
                  onClick={() => setActiveStatus(tab.key)}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: activeStatus === tab.key ? "#fff" : tab.dot, display: "inline-block" }} />
                  {tab.label}
                  {tab.key !== "all" && (
                    <span style={{
                      background: "rgba(255,255,255,0.25)", borderRadius: 999,
                      padding: "1px 6px", fontSize: "0.7rem", fontWeight: 800,
                    }}>
                      {tab.key === "pending"   ? stats.pending   :
                       tab.key === "completed" ? stats.completed :
                       tab.key === "received"  ? stats.received  : stats.cancelled}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Row 3: date picker (collapsible) */}
            {showFilter && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", padding: "14px 0 0", borderTop: "1px solid #eef2ff" }}>
                <div className="dashboard-field">
                  <label>Từ ngày</label>
                  <DatePicker
                    selected={startDateInput}
                    onChange={(d) => setStartDateInput(d)}
                    placeholderText="dd/mm/yyyy"
                    className="dashboard-input"
                    locale="vi"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="dashboard-field">
                  <label>Đến ngày</label>
                  <DatePicker
                    selected={endDateInput}
                    onChange={(d) => setEndDateInput(d)}
                    placeholderText="dd/mm/yyyy"
                    className="dashboard-input"
                    locale="vi"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <button type="button" className="dashboard-btn dashboard-btn-primary" onClick={applyFilter}>
                  <FaFilter /> Áp dụng
                </button>
                <button type="button" className="dashboard-btn dashboard-btn-secondary"
                  onClick={() => { setStartDate(null); setEndDate(null); setStartDateInput(null); setEndDateInput(null); }}
                >
                  <FaTimes /> Xóa ngày
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">
              <span className="dashboard-panel-title-dot" />
              Danh sách đơn hàng
            </h2>
            <span className="dashboard-count">{filteredOrders.length} kết quả</span>
          </div>

          {loading ? (
            <div className="dashboard-empty">Đang tải dữ liệu...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="dashboard-empty">
              <div className="commerce-empty-icon"><FaBoxOpen /></div>
              <h3>Không có đơn hàng phù hợp</h3>
              <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table dashboard-table-compact">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th style={{ width: 210 }}>Khách hàng</th>
                    <th>Địa chỉ giao</th>
                    <th style={{ width: 148 }}>Thanh toán</th>
                    <th style={{ width: 105 }}>Số tiền</th>
                    <th style={{ width: 110 }}>Ngày tạo</th>
                    <th style={{ width: 115 }}>Trạng thái</th>
                    <th style={{ width: 52 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => {
                    const customerName = order.email || order.name || "Khách hàng";
                    const initials     = customerName.slice(0, 2).toUpperCase();
                    const badge        = getBadge(order.status);
                    const isCash       = order.payment_method === "cash";
                    const dateObj      = new Date(order.created_at || order.order_date);

                    return (
                      <tr key={order.id}>
                        <td className="dashboard-index">{String(index + 1).padStart(2, "0")}</td>
                        <td>
                          <div className="dashboard-product">
                            <div className="dashboard-avatar" style={{ background: `hsl(${(customerName.charCodeAt(0) * 37) % 360}, 65%, 52%)` }}>{initials}</div>
                            <div>
                              <div style={{ fontWeight: 800 }}>{order.name || "Khách hàng"}</div>
                              <div className="dashboard-muted" style={{ fontSize: "0.75rem" }}>{order.email}</div>
                            </div>
                          </div>
                        </td>
                        <td title={order.address || ""} style={{ maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8rem", color: "#475569" }}>
                            {order.address || "—"}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span className={`dashboard-badge ${isCash ? "dashboard-badge-warning" : "dashboard-badge-neutral"}`}>
                            {isCash ? "Tiền mặt" : "Chuyển khoản"}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 900, fontSize: "0.92rem", letterSpacing: "-0.02em",
                            background: "linear-gradient(135deg,#7c3aed,#4338ca)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                          }}>{fmt(order.amount)}</span>
                        </td>
                        <td style={{ fontSize: "0.82rem" }}>
                          <div>{dateObj.toLocaleDateString("vi-VN")}</div>
                          <div className="dashboard-muted">{dateObj.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}><span className={`dashboard-badge ${badge.cls}`}>{badge.label}</span></td>
                        <td>
                          <button type="button" className="dashboard-btn dashboard-btn-danger" style={{ padding: "7px 10px" }} onClick={() => handleDelete(order.id)}>
                            <FaTrash />
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

      </div>
    </div>
  );
};

export default OrderList;
