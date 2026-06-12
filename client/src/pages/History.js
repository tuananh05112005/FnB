import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt, FaCreditCard, FaEye, FaHistory,
  FaMoneyBill, FaShoppingBag, FaTrash, FaSearch,
  FaFilter, FaTimes, FaReceipt, FaChartLine,
} from "react-icons/fa";

import { api } from "../lib/api";
import socket from "../lib/socket";
import { getRole, getUserId } from "../lib/session";
import Pagination from "../components/common/Pagination";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const PAGE_SIZE = 10;

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(Number(n) || 0);

/** Trả về Date object hợp lệ từ nhiều field có thể có, hoặc null */
const parseDate = (item) => {
  const raw = item?.order_date || item?.created_at || item?.payment_date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

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

// Component quản lý lịch sử giao dịch/mua hàng dành cho khách hàng
const History = () => {
  const navigate = useNavigate();
  const userId   = getUserId(); // Lấy ID của user hiện tại từ session
  const role     = getRole();

  // Khai báo các State
  const [history,  setHistory]  = useState([]); // Danh sách lịch sử mua hàng tải về từ API
  const [loading,  setLoading]  = useState(true); // Trạng thái đang tải trang
  const [error,    setError]    = useState(""); // Lưu thông báo lỗi nếu tải thất bại
  const [search,   setSearch]   = useState(""); // Từ khóa tìm kiếm sản phẩm hoặc mã đơn
  const [filter,   setFilter]   = useState("all"); // Bộ lọc hình thức thanh toán (all, cash, banking)
  const [viewMode, setViewMode] = useState("card"); // Chế độ hiển thị: dạng thẻ (card) hoặc dạng bảng (table)
  const [page,     setPage]     = useState(1); // Trang hiện tại khi phân trang

  // Effect 1: Tải lịch sử mua hàng của khách hàng từ API khi mở trang
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

  // Effect 2: Đăng ký Socket listener để đồng bộ hóa cập nhật trạng thái đơn hàng Real-time từ phía Admin/Staff
  useEffect(() => {
    const handleStatusUpdate = (data) => {
      setHistory((prev) =>
        prev.map((item) => (item.cart_id === Number(data.orderId) ? { ...item, status: data.status } : item))
      );
    };

    socket.on("orderStatusUpdated", handleStatusUpdate);
    return () => {
      socket.off("orderStatusUpdated", handleStatusUpdate);
    };
  }, []);

  // Hàm handleDelete: Cho phép người dùng xóa lịch sử giao dịch đơn hàng của riêng mình
  const handleDelete = async (paymentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
    try {
      await api.delete(`/api/payments/${paymentId}`);
      setHistory((prev) => prev.filter((item) => item.payment_id !== paymentId));
    } catch (e) {
      setError("Không thể xóa giao dịch này.");
    }
  };

  // Tính toán các số liệu tổng quan chi tiêu
  const totalAmount  = useMemo(() => history.reduce((s, i) => s + Number(i.amount || 0), 0), [history]); // Tổng chi tiêu
  const cashOrders   = useMemo(() => history.filter((i) => i.payment_method === "cash"), [history]); // Số lượng đơn thanh toán tiền mặt
  const bankOrders   = useMemo(() => history.filter((i) => i.payment_method !== "cash"), [history]); // Số lượng đơn thanh toán banking

  // useMemo: Lọc danh sách giao dịch dựa trên từ khóa tìm kiếm và bộ lọc hình thức thanh toán
  const displayed = useMemo(() => {
    let list = [...history];
    if (filter !== "all") list = list.filter((i) => i.payment_method === filter);
    if (search.trim())    list = list.filter((i) =>
      (i.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(i.payment_id).includes(search)
    );
    return list;
  }, [history, filter, search]);

  // useMemo: Phân trang danh sách giao dịch
  const pagedDisplayed = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return displayed.slice(start, start + PAGE_SIZE);
  }, [displayed, page]);

  // useMemo: Gom nhóm danh sách giao dịch theo ngày tạo để hiển thị dạng Timeline trên giao diện thẻ
  const grouped = useMemo(() => {
    const map = {};
    pagedDisplayed.forEach((item) => {
      const d = parseDate(item);
      const label = d
        ? d.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : "Không rõ ngày";
      if (!map[label]) map[label] = [];
      map[label].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => {
      const da = parseDate(map[a][0]);
      const db = parseDate(map[b][0]);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db - da;
    });
  }, [pagedDisplayed]);

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
        {role !== "user" && (
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
        )}

        {/* ── Total banner ── */}
        {role !== "user" && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-body">
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                {/* Icon */}
                <div className="dashboard-stat-icon" style={{
                  background: "var(--color-brand-pale)",
                  color: "var(--color-brand-dark)",
                  width: 52, height: 52, fontSize: "1.2rem",
                  borderRadius: "var(--radius-md)",
                }}>
                  <FaReceipt />
                </div>

                {/* Amount */}
                <div>
                  <p className="dashboard-stat-label" style={{ margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.7rem" }}>
                    Tổng chi tiêu
                  </p>
                  <p className="dashboard-money-primary" style={{ margin: 0, fontSize: "1.8rem" }}>
                    {fmt(totalAmount)}
                  </p>
                </div>

                {/* Right meta */}
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <p style={{ color: "var(--color-text-faint)", fontSize: "0.8rem", margin: 0, fontWeight: 500 }}>
                    Từ {history.length} giao dịch
                  </p>
                  <p style={{ color: "var(--color-brand-dark)", fontWeight: 700, fontSize: "0.875rem", margin: "4px 0 0" }}>
                    TB {history.length ? fmt(Math.round(totalAmount / history.length)) : "—"} / đơn
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}


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
                onClick={() => { setFilter(f.key); setPage(1); }}
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
          <>
          {/* ── Card / Timeline view ── */}

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
                            {parseDate(item)
                              ? parseDate(item).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                              : "—"}
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

          {/* Card view pagination */}
          <Pagination
            currentPage={page}
            totalItems={displayed.length}
            pageSize={PAGE_SIZE}
            onChange={(p) => setPage(p)}
          />
        </>

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
                  {displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item, i) => {
                    const method = getMethod(item.payment_method);
                    const status = getStatus(item.status);
                    return (
                      <tr key={item.payment_id}>
                        <td className="dashboard-index">{String((page - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}</td>
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
                            {parseDate(item)
                              ? parseDate(item).toLocaleString("vi-VN")
                              : <span style={{ color: "#94a3b8" }}>—</span>}
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
            {/* Table view pagination */}
            <Pagination
              currentPage={page}
              totalItems={displayed.length}
              pageSize={PAGE_SIZE}
              onChange={(p) => setPage(p)}
            />
          </section>
        )} 
      </div>
    </div>
  );
};

export default History;
