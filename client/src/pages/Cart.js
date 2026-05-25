import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaChartLine, FaCheck, FaCreditCard,
  FaShoppingCart, FaTimes, FaTruck,
} from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import Pagination from "../components/common/Pagination";
import { api } from "../lib/api";
import { getRole, getToken, getUserId } from "../lib/session";
import { cancelCartItem, getCart, markCartItemReceived, updateCartItem } from "../services/cartService";
import "../styles/dashboard.css";
import "../styles/commerce.css";

const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0);

/* ── Cancel modal (native, no react-bootstrap) ───────────────────── */
function CancelModal({ show, item, reason, onReasonChange, onConfirm, onClose }) {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: "var(--z-modal)", padding: "var(--space-4)",
      animation: "fadeIn 0.2s ease",
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--color-surface)", borderRadius: "var(--radius-xl)",
        width: "100%", maxWidth: 400, boxShadow: "var(--shadow-xl)",
        overflow: "hidden", animation: "scaleIn 0.3s ease",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#7A4C04,#C8860A)", padding: "var(--space-5) var(--space-6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontFamily: "var(--app-font-display)", fontWeight: 700, color: "white", fontSize: "1rem" }}>Hủy đơn hàng</p>
            {item && <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>#{item.id} – {item.name}</p>}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "rgba(255,255,255,0.8)", borderRadius: "var(--radius-sm)", width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="dashboard-field">
            <label htmlFor="cancel-reason">Lý do hủy đơn</label>
            <select id="cancel-reason" className="dashboard-select" value={reason} onChange={(e) => onReasonChange(e.target.value)}>
              <option value="">-- Chọn lý do --</option>
              <option value="Không còn nhu cầu">Không còn nhu cầu</option>
              <option value="Đặt nhầm sản phẩm">Đặt nhầm sản phẩm</option>
              <option value="Giao hàng chậm">Giao hàng chậm</option>
              <option value="Lý do khác">Lý do khác</option>
            </select>
          </div>
          {!reason && <p style={{ fontSize: "0.8rem", color: "var(--color-danger)", margin: 0 }}>Vui lòng chọn lý do hủy</p>}
        </div>
        {/* Footer */}
        <div style={{ padding: "0 var(--space-6) var(--space-5)", display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
          <button className="dashboard-btn dashboard-btn-secondary" onClick={onClose}>Đóng</button>
          <button className="dashboard-btn dashboard-btn-danger" onClick={onConfirm} disabled={!reason}>
            <FaTimes /> Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

const Cart = () => {
  const navigate = useNavigate();
  const userId = getUserId();
  const token = getToken();
  const role = getRole();

  const [cartItems, setCartItems] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [sortField, setSortField] = useState("order_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || !token) navigate("/login");
  }, [navigate, token, userId]);

  const refreshCart = async () => {
    try {
      const items = role === "admin"
        ? await api.get("/api/admin/orders").then((r) => r.data)
        : await getCart(userId);
      setCartItems(items);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [items, revenue] = await Promise.all([
          role === "admin"
            ? api.get("/api/admin/orders").then((r) => r.data)
            : getCart(userId),
          role === "admin"
            ? api.get("/api/admin/revenue").then((r) => r.data.total_revenue || 0)
            : Promise.resolve(0),
        ]);
        setCartItems(items);
        setTotalRevenue(revenue);
      } catch (e) {
        console.error(e);
        setError("Không thể tải dữ liệu giỏ hàng lúc này.");
      }
    };
    if (userId && token) load();
  }, [role, token, userId]);

  const sortedItems = useMemo(() => {
    const items = [...cartItems];
    items.sort((a, b) => {
      const l = a[sortField], r = b[sortField];
      if (sortField === "order_date") return sortOrder === "asc" ? new Date(l) - new Date(r) : new Date(r) - new Date(l);
      if (typeof l === "number") return sortOrder === "asc" ? l - r : r - l;
      return sortOrder === "asc" ? String(l).localeCompare(String(r)) : String(r).localeCompare(String(l));
    });
    return items;
  }, [cartItems, sortField, sortOrder]);

  const pagedItems = sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));

  const statusGroups = useMemo(() => {
    const c = { pending: 0, completed: 0, received: 0, cancelled: 0 };
    cartItems.forEach((i) => { if (c[i.status] !== undefined) c[i.status]++; });
    return c;
  }, [cartItems]);

  const handleSort = (field) => {
    if (sortField === field) { setSortOrder((p) => p === "asc" ? "desc" : "asc"); }
    else { setSortField(field); setSortOrder(field === "order_date" ? "desc" : "asc"); }
    setCurrentPage(1);
  };

  const handleQuantityChange = async (itemId, qty) => {
    const q = Number(qty);
    if (!itemId || isNaN(q) || q < 1) return;
    try { await updateCartItem(itemId, { quantity: q }); refreshCart(); }
    catch (e) { console.error(e); setError("Không thể cập nhật số lượng."); }
  };

  const handleCheckout = (item) => navigate("/payment", { state: { item } });

  const handleConfirmCancel = async () => {
    if (!selectedItem || !cancellationReason) return;
    try {
      await cancelCartItem(selectedItem.id);
      await refreshCart();
      setShowCancelModal(false); setSelectedItem(null); setCancellationReason("");
    } catch (e) { console.error(e); setError("Không thể hủy đơn hàng này."); }
  };

  const handleReceived = async (itemId) => {
    try { await markCartItemReceived(itemId); refreshCart(); }
    catch (e) { console.error(e); setError("Không thể cập nhật trạng thái nhận hàng."); }
  };

  const STATUS_MAP = {
    pending:   { cls: "dashboard-badge-warning", label: role === "admin" ? "Đang xử lý" : "Chưa thanh toán" },
    completed: { cls: "dashboard-badge-info",    label: role === "admin" ? "Đang giao"  : "Đã thanh toán"  },
    received:  { cls: "dashboard-badge-success", label: role === "admin" ? "Đã giao"    : "Đã nhận hàng"  },
    cancelled: { cls: "dashboard-badge-danger",  label: "Đã hủy" },
  };

  const renderActions = (item) => {
    if (role === "user") {
      if (item.status === "pending") return (
        <button className="dashboard-btn dashboard-btn-primary" onClick={() => handleCheckout(item)}>
          <FaCreditCard /> Thanh toán
        </button>
      );
      if (item.status === "completed") return (
        <>
          <button className="dashboard-btn dashboard-btn-success" onClick={() => handleReceived(item.id)}>
            <FaCheck /> Đã nhận
          </button>
          <button className="dashboard-btn dashboard-btn-danger" onClick={() => { setSelectedItem(item); setShowCancelModal(true); }}>
            <FaTimes /> Hủy
          </button>
        </>
      );
    }
    if (role === "admin" && !["cancelled","received"].includes(item.status)) return (
      <button className="dashboard-btn dashboard-btn-danger" onClick={() => { setSelectedItem(item); setShowCancelModal(true); }}>
        <FaTimes /> Hủy đơn
      </button>
    );
    return <span style={{ fontSize: "0.78rem", color: "var(--color-text-faint)" }}>—</span>;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">

        {/* Header */}
        <div className="dashboard-header animate-fadeInUp">
          <div className="dashboard-title-wrap">
            <div className="dashboard-icon"><FaShoppingCart /></div>
            <div>
              <h1 className="dashboard-title">{role === "admin" ? "Quản lý đơn hàng" : "Giỏ hàng của tôi"}</h1>
              <p className="dashboard-subtitle">{role === "admin" ? "Theo dõi tình trạng đơn và tổng doanh thu." : "Kiểm tra đơn đang xử lý, thanh toán và xác nhận nhận hàng."}</p>
            </div>
          </div>
          <button className="dashboard-back-btn" onClick={() => navigate("/products")}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>

        {/* Admin revenue card */}
        {role === "admin" && (
          <div className="dashboard-panel animate-fadeIn" style={{ borderLeft: "4px solid var(--color-brand)", display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-5) var(--space-6)" }}>
            <div className="dashboard-stat-icon" style={{ background: "var(--color-brand-pale)", color: "var(--color-brand-dark)", borderRadius: "var(--radius-md)" }}>
              <FaChartLine />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-faint)" }}>Tổng doanh thu</p>
              <p className="dashboard-money-primary" style={{ margin: "4px 0 0", fontSize: "2rem" }}>{fmt(totalRevenue)}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="dashboard-stats-grid animate-fadeInUp animate-delay-1">
          {[
            { icon: <FaShoppingCart />, label: "Tổng đơn",   value: cartItems.length,      bg: "var(--color-brand-pale)",    color: "var(--color-brand-dark)", accent: "var(--color-brand)" },
            { icon: <FaCreditCard />,   label: "Đang xử lý", value: statusGroups.pending,   bg: "var(--color-warning-light)", color: "var(--color-warning)",     accent: "var(--color-warning)" },
            { icon: <FaTruck />,        label: "Đang giao",  value: statusGroups.completed, bg: "var(--color-info-light)",    color: "var(--color-info)",        accent: "var(--color-info)" },
            { icon: <FaTimes />,        label: "Đã hủy",     value: statusGroups.cancelled, bg: "var(--color-danger-light)",  color: "var(--color-danger)",      accent: "var(--color-danger)" },
          ].map((s) => (
            <article key={s.label} className="dashboard-stat dashboard-stat-accent" style={{ "--stat-accent": s.accent }}>
              <div className="dashboard-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p className="dashboard-stat-value">{s.value}</p>
                <p className="dashboard-stat-label">{s.label}</p>
              </div>
            </article>
          ))}
        </div>

        {error && <div className="commerce-alert commerce-alert-danger animate-fadeIn">{error}</div>}

        {/* Sort toolbar */}
        <div className="dashboard-toolbar animate-fadeIn animate-delay-2">
          <div className="dashboard-toolbar-group">
            {[["order_date","Ngày đặt"],["price","Giá"],["name","Tên"]].map(([f, lbl]) => (
              <button key={f} type="button"
                className={`dashboard-chip ${sortField === f ? "active" : ""}`}
                onClick={() => handleSort(f)}>
                {lbl} {sortField === f && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            <strong>{sortedItems.length}</strong> đơn hàng
          </span>
        </div>

        {/* Orders table */}
        <section className="dashboard-panel animate-fadeInUp animate-delay-2">
          <div className="dashboard-panel-header">
            <h2 className="dashboard-panel-title">🛒 Danh sách đơn hàng</h2>
          </div>
          {pagedItems.length === 0 ? (
            <div className="dashboard-empty">
              <div style={{ fontSize: "3rem", opacity: 0.25 }}>🛒</div>
              <h3>Chưa có đơn hàng nào</h3>
              <p>Hãy chọn sản phẩm yêu thích và đặt hàng!</p>
              <button className="dashboard-btn dashboard-btn-primary" onClick={() => navigate("/products")}>
                Xem sản phẩm
              </button>
            </div>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table dashboard-table-compact">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th>Đơn giá</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                    <th>Ngày đặt</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item, idx) => {
                    const st = STATUS_MAP[item.status] || { cls: "dashboard-badge-neutral", label: "N/A" };
                    return (
                      <tr key={item.id}>
                        <td className="dashboard-index">{String((currentPage - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}</td>
                        <td>
                          <div className="dashboard-product">
                            <ProductImage src={item.image} alt={item.name} className="dashboard-thumb" />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{item.name}</div>
                              <span className="dashboard-code">{item.code || "SP"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="dashboard-money">{fmt(item.price)}</td>
                        <td>
                          <input type="number" min="1" value={item.quantity}
                            disabled={["completed","cancelled","received"].includes(item.status)}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            style={{ width: 56, height: 34, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--color-border)", background: "var(--color-bg-alt)", color: "var(--color-text)", textAlign: "center", fontSize: "0.875rem", fontWeight: 600, outline: "none", padding: 0 }}
                          />
                        </td>
                        <td className="dashboard-money" style={{ color: "var(--color-brand-dark)", fontWeight: 800 }}>
                          {fmt(Number(item.price) * Number(item.quantity))}
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                          {new Date(item.order_date).toLocaleDateString("vi-VN")}
                        </td>
                        <td><span className={`dashboard-badge ${st.cls}`}>{st.label}</span></td>
                        <td><div className="dashboard-action-row">{renderActions(item)}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedItems.length}
          pageSize={PAGE_SIZE}
          onChange={(p) => setCurrentPage(p)}
        />
      </div>

      <CancelModal
        show={showCancelModal}
        item={selectedItem}
        reason={cancellationReason}
        onReasonChange={setCancellationReason}
        onConfirm={handleConfirmCancel}
        onClose={() => { setShowCancelModal(false); setSelectedItem(null); setCancellationReason(""); }}
      />
    </div>
  );
};

export default Cart;
