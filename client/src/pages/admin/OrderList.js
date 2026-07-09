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
import socket from "../../lib/socket";
import Pagination from "../../components/common/Pagination";
import "../../styles/dashboard.css";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("vi", vi);

const PAGE_SIZE = 10;

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

// Component chính quản lý danh sách đơn hàng dành cho Admin/Staff
const OrderList = () => {
  const navigate = useNavigate();

  // Khai báo các State
  const [orders,         setOrders]         = useState([]); // Danh sách toàn bộ đơn hàng/giao dịch lấy từ API
  const [loading,        setLoading]        = useState(true); // Trạng thái tải trang
  const [activeStatus,   setActiveStatus]   = useState("all"); // Bộ lọc trạng thái đơn hàng đang chọn (All, Pending, Completed, Received, Cancelled)
  const [search,         setSearch]         = useState(""); // Nội dung ô tìm kiếm (email, tên, mã đơn)
  const [startDateInput, setStartDateInput] = useState(null); // Ngày bắt đầu lọc (ở ô nhập liệu)
  const [endDateInput,   setEndDateInput]   = useState(null); // Ngày kết thúc lọc (ở ô nhập liệu)
  const [startDate,      setStartDate]      = useState(null); // Ngày bắt đầu lọc chính thức áp dụng
  const [endDate,        setEndDate]        = useState(null); // Ngày kết thúc lọc chính thức áp dụng
  const [showFilter,     setShowFilter]     = useState(false); // Trạng thái hiển thị form lọc theo ngày
  const [page,           setPage]           = useState(1); // Trang hiện tại (Pagination)

  // Effect 1: Tải danh sách đơn hàng từ API khi mở trang
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

  // Effect 2: Đăng ký các sự kiện Socket.io để đồng bộ trạng thái đơn hàng thời gian thực (Real-time)
  useEffect(() => {
    // Lắng nghe khi khách hàng xác nhận đã nhận hàng thành công
    const handleOrderDelivered = (data) => {
      setOrders((prev) =>
        prev.map((o) => (o.cart_id === Number(data.id) ? { ...o, status: "received" } : o))
      );
    };

    // Lắng nghe khi đơn hàng bị hủy
    const handleOrderCancelled = (data) => {
      setOrders((prev) =>
        prev.map((o) => (o.cart_id === Number(data.id) ? { ...o, status: "cancelled" } : o))
      );
    };

    // Lắng nghe khi Admin hoặc quy trình tự động cập nhật trạng thái đơn hàng
    const handleOrderStatusUpdated = (data) => {
      setOrders((prev) =>
        prev.map((o) => (o.cart_id === Number(data.orderId) ? { ...o, status: data.status } : o))
      );
    };

    // Lắng nghe khi đơn hàng banking hoàn tất thanh toán thành công
    const handleOrderPaid = (data) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === Number(data.id) ? { ...o, status: "completed" } : o))
      );
    };

    socket.on("orderDelivered", handleOrderDelivered);
    socket.on("orderCancelled", handleOrderCancelled);
    socket.on("orderStatusUpdated", handleOrderStatusUpdated);
    socket.on("orderPaid", handleOrderPaid);

    // Hủy đăng ký listener khi component unmount
    return () => {
      socket.off("orderDelivered", handleOrderDelivered);
      socket.off("orderCancelled", handleOrderCancelled);
      socket.off("orderStatusUpdated", handleOrderStatusUpdated);
      socket.off("orderPaid", handleOrderPaid);
    };
  }, []);

  // useMemo: Lọc danh sách theo khoảng ngày và từ khóa tìm kiếm (không lọc theo trạng thái để giữ nguyên thống kê trên các thẻ)
  const baseFilteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.created_at || o.order_date);
      const matchStart  = !startDate || d >= new Date(new Date(startDate).setHours(0, 0, 0, 0));
      const matchEnd    = !endDate   || d <= new Date(new Date(endDate).setHours(23, 59, 59, 999));
      const q = search.toLowerCase();
      const matchSearch = !q || (o.email || "").toLowerCase().includes(q)
        || (o.name || "").toLowerCase().includes(q)
        || String(o.id).includes(q);
      return matchStart && matchEnd && matchSearch;
    });
  }, [endDate, orders, startDate, search]);

  // useMemo: Lọc và sắp xếp danh sách đơn hàng cuối cùng (áp dụng tiếp activeStatus)
  const filteredOrders = useMemo(() => {
    const list = baseFilteredOrders.filter((o) => {
      return activeStatus === "all" || o.status === activeStatus;
    });

    // Sắp xếp: Đơn chưa thanh toán (pending) lên trước, sau đó xếp theo thời gian mới nhất
    list.sort((a, b) => {
      const aUnpaid = a.status === "pending" ? 1 : 0;
      const bUnpaid = b.status === "pending" ? 1 : 0;
      if (aUnpaid !== bUnpaid) {
        return bUnpaid - aUnpaid; // Đơn chưa thanh toán (1) đứng trước (0)
      }
      const dateA = new Date(a.created_at || a.order_date);
      const dateB = new Date(b.created_at || b.order_date);
      return dateB - dateA; // Ngày giảm dần (mới nhất lên trước)
    });

    return list;
  }, [baseFilteredOrders, activeStatus]);

  // useMemo: Tính toán các số liệu thống kê đơn hàng (Tổng doanh thu, số lượng đơn theo hình thức thanh toán/trạng thái)
  const stats = useMemo(() => {
    const cash    = baseFilteredOrders.filter((o) => o.payment_method === "cash");
    const banking = baseFilteredOrders.filter((o) => o.payment_method !== "cash");
    return {
      total:      baseFilteredOrders.length,
      revenue:    baseFilteredOrders.reduce((s, o) => s + Number(o.amount || 0), 0),
      cash:       cash.length,
      banking:    banking.length,
      pending:    baseFilteredOrders.filter((o) => o.status === "pending").length,
      completed:  baseFilteredOrders.filter((o) => o.status === "completed").length,
      received:   baseFilteredOrders.filter((o) => o.status === "received").length,
      cancelled:  baseFilteredOrders.filter((o) => o.status === "cancelled").length,
    };
  }, [baseFilteredOrders]);

  // Hàm handleDelete: Gửi yêu cầu xóa giao dịch đơn hàng lên server
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await api.delete(`/api/admin/payments/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      console.error("Failed to delete order:", e);
    }
  };

  const applyFilter = () => { setStartDate(startDateInput); setEndDate(endDateInput); setPage(1); };
  const resetFilter = () => {
    setActiveStatus("all"); setSearch("");
    setStartDate(null); setEndDate(null);
    setStartDateInput(null); setEndDateInput(null);
    setPage(1);
  };
  const hasFilter = activeStatus !== "all" || search || startDate || endDate;

  /* Paginated slice */
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  const statCards = [
    { label: "Tổng đơn",      statusKey: "all",       value: stats.total,    icon: <FaBoxOpen />,       accent: "#7c3aed", bg: "#f5f3ff", color: "#7c3aed" },
    { label: "Đang xử lý",    statusKey: "pending",   value: stats.pending,  icon: <FaClipboardList />, accent: "#f59e0b", bg: "#fff7ed", color: "#f59e0b" },
    { label: "Đang giao",      statusKey: "completed", value: stats.completed,icon: <FaUniversity />,    accent: "#3b82f6", bg: "#eff6ff", color: "#3b82f6" },
    { label: "Đã hủy",         statusKey: "cancelled", value: stats.cancelled,icon: <FaTimes />,         accent: "#ef4444", bg: "#fef2f2", color: "#ef4444" },
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {/* Main Revenue Card */}
          <div className="dashboard-stat" style={{
            background: "linear-gradient(135deg, var(--sidebar-bg) 0%, #3D2B14 100%)",
            border: "1.5px solid var(--color-brand)",
            boxShadow: "var(--shadow-brand)",
            borderRadius: 18,
            padding: "20px 24px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 16
          }}>
            <div className="dashboard-stat-icon" style={{ background: "rgba(200, 134, 10, 0.2)", color: "var(--color-brand)", width: 52, height: 52, fontSize: "1.3rem", borderRadius: 14 }}>
              <FaMoneyBillWave />
            </div>
            <div>
              <p className="dashboard-stat-label" style={{ margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.72rem", color: "var(--color-brand-light)", fontWeight: 700 }}>Tổng doanh thu</p>
              <p className="dashboard-money-primary" style={{ margin: 0, fontSize: "1.8rem", color: "#fff", fontWeight: 900 }}>{fmt(stats.revenue)}</p>
            </div>
          </div>

          {/* Micro-metric capsules */}
          {[
            { icon: <FaMoneyBill />,   label: "Tiền mặt",     value: stats.cash    + " đơn", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.15)" },
            { icon: <FaCreditCard />,  label: "Chuyển khoản", value: stats.banking + " đơn", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.15)" },
            { icon: <FaCheckCircle />, label: "Đã giao",      value: stats.received + " đơn",color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.15)" },
          ].map((m) => (
            <div key={m.label} className="dashboard-stat" style={{
              background: "var(--color-surface)",
              borderRadius: 18,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: m.border,
              boxShadow: "var(--shadow-sm)"
            }}>
              <div className="dashboard-stat-icon" style={{ background: m.bg, color: m.color, width: 44, height: 44, fontSize: "1.1rem", borderRadius: 12 }}>
                {m.icon}
              </div>
              <div>
                <p className="dashboard-stat-label" style={{ margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.68rem", color: "var(--color-text-muted)" }}>{m.label}</p>
                <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text)" }}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Stat cards ── */}
        <div className="dashboard-stats-grid">
          {statCards.map((s) => {
            const isActive = activeStatus === s.statusKey;
            return (
              <article
                key={s.label}
                className="dashboard-stat dashboard-stat-accent"
                onClick={() => {
                  setActiveStatus(s.statusKey);
                  setPage(1);
                }}
                style={{
                  "--stat-accent": s.accent,
                  cursor: "pointer",
                  transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isActive ? "translateY(-4px) scale(1.025)" : "none",
                  border: isActive ? `1.5px solid ${s.accent}` : "1.5px solid transparent",
                  boxShadow: isActive ? `0 10px 20px -5px ${s.accent}25` : "var(--shadow-sm)"
                }}
              >
                <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <p className="dashboard-stat-value">{s.value}</p>
                  <p className="dashboard-stat-label">{s.label}</p>
                </div>
              </article>
            );
          })}
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
            <div className="dashboard-toolbar-group" style={{ flexWrap: "wrap", gap: 10 }}>
              {STATUS_TABS.map((tab) => (
                <button key={tab.key} type="button"
                  className={`dashboard-chip ${activeStatus === tab.key ? "active" : ""}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                  onClick={() => setActiveStatus(tab.key)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: activeStatus === tab.key ? "#fff" : tab.dot }} />
                  <span>{tab.label}</span>
                  {tab.key !== "all" && (
                    <span style={{
                      background: activeStatus === tab.key ? "rgba(255,255,255,0.25)" : "var(--color-bg-warm, #f1f5f9)",
                      color: activeStatus === tab.key ? "#fff" : "var(--color-text-muted, #64748b)",
                      borderRadius: 999,
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
            <>
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
                  {pagedOrders.map((order, index) => {
                    const absIndex = (page - 1) * PAGE_SIZE + index;
                    const customerName = order.email || order.name || "Khách hàng";
                    const initials     = customerName.slice(0, 2).toUpperCase();
                    const badge        = getBadge(order.status);
                    const isCash       = order.payment_method === "cash";
                    const dateObj      = new Date(order.created_at || order.order_date);

                    return (
                      <tr key={order.id}>
                        <td className="dashboard-index">{String(absIndex + 1).padStart(2, "0")}</td>
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
                          <span className="dashboard-money-primary" style={{ fontSize: "0.92rem" }}>{fmt(order.amount)}</span>
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
            {/* Pagination */}
            <Pagination
              currentPage={page}
              totalItems={filteredOrders.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => setPage(p)}
            />
            </>
          )}
        </section>

      </div>
    </div>
  );
};

export default OrderList;
