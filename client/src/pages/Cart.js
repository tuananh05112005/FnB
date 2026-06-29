// ==============================================================
// TÊN FILE: Cart.js
// MÔ TẢ: Trang Giỏ hàng (Cart) của hệ thống FnB. Cho phép khách hàng quản lý đơn hàng
//        (xem giỏ hàng, cập nhật số lượng món ăn, thanh toán qua cổng PaymentPage, hủy đơn với lý do cụ thể).
//        Đối với vai trò Admin, trang này hiển thị danh sách toàn bộ các đơn hàng trong hệ thống,
//        tổng hợp doanh thu và cho phép admin hủy đơn hàng của khách hàng kèm lý do hủy đơn.
// ==============================================================

/**
 * Trang Giỏ hàng (Cart): hiển thị danh sách đơn hàng gộp theo mã đơn hàng (order_code),
 * cho phép chỉnh sửa số lượng, thanh toán cả đơn, thêm món và hủy đơn.
 */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaChartLine, FaCheck, FaCreditCard,
  FaShoppingCart, FaTimes, FaTruck, FaPlus,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

import ProductImage from "../components/common/ProductImage";
import ProductCustomizationModal from "../components/common/ProductCustomizationModal";
import Pagination from "../components/common/Pagination";
import { api } from "../lib/api";
import { getRole, getToken, getUserId } from "../lib/session";
import { addToCart, cancelCartItem, getCart, markCartItemReceived, removeCartItem, updateCartItem } from "../services/cartService";
import { listProducts, isProductAvailable } from "../services/productService";
import { useNotifications } from "../components/common/NotificationContext";
import "../styles/dashboard.css";
import "../styles/commerce.css";

// Hàm tiện ích định dạng số thành tiền tệ VNĐ (ví dụ: 15.000 ₫)
const fmt = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0);

/* ── Cancel modal (native, no react-bootstrap) ───────────────────── */
/**
 * CancelModal: Hộp thoại xác nhận hủy đơn hàng.
 * Cho phép người dùng hoặc Admin chọn lý do hủy đơn hàng trước khi thực hiện hành động.
 */
function CancelModal({ show, item, reason, onReasonChange, onConfirm, onClose }) {
  if (!show) return null;
  return createPortal(
    <div className="custom-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="custom-modal-container" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="custom-modal-header" style={{ background: "linear-gradient(135deg,#7A4C04,#C8860A)", borderBottom: "none" }}>
          <div>
            <h3 style={{ color: "white" }}>Hủy đơn hàng</h3>
            {item && (
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
                #{item.order_code} – {item.items ? item.items.map(it => it.name).join(", ") : item.name}
              </p>
            )}
          </div>
          <button className="custom-modal-close-btn" style={{ color: "rgba(255,255,255,0.8)" }} onClick={onClose}>✕</button>
        </div>
        {/* Body */}
        <div className="custom-modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
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
        <div className="custom-modal-footer">
          <button className="dashboard-btn dashboard-btn-secondary" onClick={onClose}>Đóng</button>
          <button className="dashboard-btn dashboard-btn-danger" onClick={onConfirm} disabled={!reason}>
            <FaTimes /> Xác nhận hủy
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const Cart = () => {
  const navigate = useNavigate();
  const userId = getUserId();
  const token = getToken();
  const role = getRole();
  const { addNotification } = useNotifications();
  const [recommendations, setRecommendations] = useState([]);
  const [quickAddSuccessId, setQuickAddSuccessId] = useState(null);

  // --- Các Hook State quản lý trạng thái của Cart ---
  // cartItems: Danh sách đơn hàng/sản phẩm trong giỏ của User hoặc danh sách tất cả đơn hàng đối với Admin
  const [cartItems, setCartItems] = useState([]);
  // totalRevenue: Tổng doanh thu (chỉ áp dụng đối với tài khoản Admin)
  const [totalRevenue, setTotalRevenue] = useState(0);
  // sortField: Trường dữ liệu dùng để sắp xếp danh sách (ví dụ: ngày đặt hàng, giá, tên sản phẩm)
  const [sortField, setSortField] = useState("order_date");
  // sortOrder: Thứ tự sắp xếp ("asc" - tăng dần, "desc" - giảm dần)
  const [sortOrder, setSortOrder] = useState("desc");
  // currentPage: Số trang hiện tại phục vụ phân trang dữ liệu
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10; // Số lượng đơn hàng tối đa hiển thị trên mỗi trang
  // showCancelModal: Điều khiển trạng thái ẩn/hiển của modal hủy đơn
  const [showCancelModal, setShowCancelModal] = useState(false);
  // selectedItem: Đơn hàng đang được chọn để thực hiện thao tác (ví dụ: hủy đơn)
  const [selectedItem, setSelectedItem] = useState(null);
  // cancellationReason: Lý do hủy đơn hàng được chọn từ dropdown
  const [cancellationReason, setCancellationReason] = useState("");
  // error: Lưu trữ và hiển thị các thông điệp lỗi trong quá trình thực thi API
  const [error, setError] = useState("");
  const [customizingProduct, setCustomizingProduct] = useState(null);

  const needsCustomization = (p) => {
    if (!p || !p.category) return false;
    const cat = p.category.toLowerCase().trim();
    return cat !== "bánh" && cat !== "topping" && cat !== "bánh ngọt";
  };

  // activeTab: Tab lọc trạng thái đơn hàng hiện tại (all, pending, completed, received, cancelled)
  const [activeTab, setActiveTab] = useState("all");

  // Reset page về 1 khi chuyển đổi Tab lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Kiểm tra quyền truy cập: Nếu chưa đăng nhập (không có userId/token), chuyển hướng về trang đăng nhập
  useEffect(() => {
    if (!userId || !token) navigate("/login");
  }, [navigate, token, userId]);

  // Lấy ra danh sách gợi ý dựa trên giỏ hàng hiện tại
  useEffect(() => {
    const loadRecs = async () => {
      try {
        const allProducts = await listProducts();
        if (!Array.isArray(allProducts)) return;
        
        // Phân tích giỏ hàng
        const hasDrinks = cartItems.some(
          (item) => !["topping", "banh ngọt", "bánh ngọt", "cake", "bánh"].includes((item.category || "").toLowerCase())
        );
        const hasToppingsOrCakes = cartItems.some(
          (item) => ["topping", "banh ngọt", "bánh ngọt", "cake", "bánh"].includes((item.category || "").toLowerCase())
        );

        let filtered = [];

        if (cartItems.length === 0) {
          // Giỏ hàng trống -> Gợi ý đồ uống bán chạy
          filtered = allProducts.filter((p) => p.category?.toLowerCase() !== "topping" && isProductAvailable(p)).slice(0, 8);
        } else if (hasDrinks && !hasToppingsOrCakes) {
          // Chỉ có nước -> Gợi ý Topping và Bánh ngọt ăn kèm
          const toppings = allProducts.filter((p) => p.category?.toLowerCase() === "topping" && isProductAvailable(p));
          const cakes = allProducts.filter((p) => ["banh ngọt", "bánh ngọt", "cake", "bánh"].includes(p.category?.toLowerCase()) && isProductAvailable(p));
          filtered = [...toppings.slice(0, 4), ...cakes.slice(0, 4)];
        } else if (!hasDrinks && hasToppingsOrCakes) {
          // Chỉ có bánh/topping -> Gợi ý đồ uống
          filtered = allProducts.filter(
            (p) => !["topping", "banh ngọt", "bánh ngọt", "cake", "bánh"].includes(p.category?.toLowerCase()) && isProductAvailable(p)
          ).slice(0, 8);
        } else {
          // Có cả hai -> Gợi ý thức uống khác chưa có trong giỏ hàng
          const currentProductIds = cartItems.map((item) => item.product_id);
          filtered = allProducts.filter(
            (p) => !currentProductIds.includes(p.id) && isProductAvailable(p)
          ).slice(0, 8);
        }

        const currentProductIds = cartItems.map((item) => item.product_id);
        const finalRecs = filtered.filter((item) => !currentProductIds.includes(item.id));
        
        setRecommendations(finalRecs);
      } catch (e) {
        console.error("Lỗi lấy danh sách gợi ý cho giỏ hàng:", e);
      }
    };
    if (cartItems.length >= 0) {
      loadRecs();
    }
  }, [cartItems]);

  // Thêm nhanh gợi ý kèm theo vào giỏ hàng
  const handleQuickAdd = async (item, e) => {
    e.stopPropagation();
    if (!userId) { navigate("/login"); return; }
    try {
      if (!isProductAvailable(item)) return;
      
      if (needsCustomization(item)) {
        setCustomizingProduct({ ...item, initialQty: 1 });
      } else {
        const activeCode = localStorage.getItem("activeOrderCode");
        await addToCart(userId, item.id, 1, item.size || "M", activeCode);

        addNotification(
          "new_order",
          "🛒 Giỏ hàng",
          `Đã thêm "${item.name}" vào giỏ hàng thành công!`
        );

        setQuickAddSuccessId(item.id);
        setTimeout(() => setQuickAddSuccessId(null), 1500);

        // Làm mới giỏ hàng ngay lập tức để cập nhật danh sách và tổng tiền
        refreshCart();
      }
    } catch (e) {
      console.error(e);
      addNotification("error", "⚠️ Lỗi", "Không thể thêm sản phẩm vào giỏ hàng.");
    }
  };

  // Hàm đồng bộ và làm mới giỏ hàng bằng cách gọi API tương ứng với vai trò Admin hoặc User
  const refreshCart = async () => {
    try {
      const items = role === "admin"
        ? await api.get("/api/admin/orders").then((r) => r.data)
        : await getCart(userId);
      setCartItems(items);
    } catch (e) { console.error(e); }
  };

  // Effect chạy một lần khi component được render lần đầu (hoặc thay đổi thông tin xác thực)
  // để lấy danh sách đơn hàng và tổng doanh thu (nếu là admin)
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

  // Gộp nhóm các món ăn trong cartItems theo order_code
  const groupedOrders = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      const code = item.order_code || `DH${String(item.id).padStart(8, "0")}`;
      if (!groups[code]) {
        groups[code] = {
          order_code: code,
          user_id: item.user_id,
          user_name: item.user_name || "Khách hàng",
          user_email: item.user_email || "",
          status: item.status,
          order_date: item.order_date,
          items: [],
          totalAmount: 0,
        };
      }
      groups[code].items.push(item);
      const basePrice = Number(item.price) || 0;
      const toppingsPrice = Array.isArray(item.toppings)
        ? item.toppings.reduce((sum, t) => sum + Number(t.price || 0), 0)
        : 0;
      groups[code].totalAmount += (basePrice + toppingsPrice) * Number(item.quantity);
    });
    return Object.values(groups);
  }, [cartItems]);

  // Lọc đơn hàng theo Tab được chọn
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return groupedOrders;
    return groupedOrders.filter((order) => order.status === activeTab);
  }, [groupedOrders, activeTab]);

  // Đếm số lượng đơn hàng theo từng trạng thái cho các Tab
  const tabCounts = useMemo(() => {
    const counts = { all: groupedOrders.length, pending: 0, completed: 0, received: 0, cancelled: 0 };
    groupedOrders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return counts;
  }, [groupedOrders]);

  // Sắp xếp danh sách đơn hàng dựa trên sortField và sortOrder hiện tại
  // Ưu tiên đơn chưa thanh toán (status === 'pending') lên trước
  const sortedOrders = useMemo(() => {
    const orders = [...filteredOrders];
    orders.sort((a, b) => {
      // Đơn chưa thanh toán (pending) có độ ưu tiên cao hơn (value = 1), đã thanh toán/khác (value = 0)
      const aUnpaid = a.status === "pending" ? 1 : 0;
      const bUnpaid = b.status === "pending" ? 1 : 0;

      if (aUnpaid !== bUnpaid) {
        return bUnpaid - aUnpaid; // Đơn chưa thanh toán (1) đứng trước (0)
      }

      // Nếu cùng nhóm trạng thái thanh toán, áp dụng sortField và sortOrder
      let l = a[sortField], r = b[sortField];
      if (sortField === "name") {
        l = a.items[0]?.name || "";
        r = b.items[0]?.name || "";
      }
      if (sortField === "price") {
        l = a.totalAmount;
        r = b.totalAmount;
      }
      if (sortField === "order_date") return sortOrder === "asc" ? new Date(l) - new Date(r) : new Date(r) - new Date(l);
      if (typeof l === "number") return sortOrder === "asc" ? l - r : r - l;
      return sortOrder === "asc" ? String(l).localeCompare(String(r)) : String(r).localeCompare(String(l));
    });
    return orders;
  }, [filteredOrders, sortField, sortOrder]);

  // Chia danh sách đã sắp xếp thành các trang nhỏ (phân trang)
  const pagedOrders = sortedOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Nhóm số lượng đơn hàng theo từng trạng thái để làm thống kê nhanh (pending, completed, received, cancelled)
  const statusGroups = useMemo(() => {
    const c = { pending: 0, completed: 0, received: 0, cancelled: 0 };
    groupedOrders.forEach((o) => { if (c[o.status] !== undefined) c[o.status]++; });
    return c;
  }, [groupedOrders]);

  const pendingItems = useMemo(() => cartItems.filter((i) => i.status === "pending"), [cartItems]);
  const totalPendingAmount = useMemo(() => pendingItems.reduce((acc, curr) => {
    const toppingsPrice = Array.isArray(curr.toppings)
      ? curr.toppings.reduce((sum, t) => sum + Number(t.price || 0), 0)
      : 0;
    return acc + (Number(curr.price) + toppingsPrice) * Number(curr.quantity);
  }, 0), [pendingItems]);

  const handleCheckoutAll = () => {
    navigate("/payment", { state: { items: pendingItems, isCart: true } });
  };

  // Xử lý sự kiện khi click vào tiêu đề cột sắp xếp
  const handleSort = (field) => {
    if (sortField === field) { setSortOrder((p) => p === "asc" ? "desc" : "asc"); }
    else { setSortField(field); setSortOrder(field === "order_date" ? "desc" : "asc"); }
    setCurrentPage(1);
  };

  // Xử lý thay đổi số lượng món ăn trong giỏ hàng (Gọi API cập nhật số lượng)
  const handleQuantityChange = async (itemId, qty) => {
    const q = Number(qty);
    if (!itemId || isNaN(q) || q < 1) return;
    try { await updateCartItem(itemId, { quantity: q }); refreshCart(); }
    catch (e) { console.error(e); setError("Không thể cập nhật số lượng."); }
  };

  // Xóa một món ăn khỏi giỏ hàng
  const handleRemoveItem = async (itemId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa món ăn này khỏi đơn hàng không?")) return;
    try {
      await removeCartItem(itemId);
      await refreshCart();
    } catch (e) {
      console.error(e);
      setError("Không thể xóa món ăn.");
    }
  };

  // Chuyển hướng sang trang thanh toán PaymentPage với thông tin đơn hàng cụ thể
  const handleCheckout = (order) => navigate("/payment", { state: { items: order.items, isCart: true, orderCode: order.order_code } });

  // Thêm món vào đơn hàng hiện có
  const handleAddMoreItems = (orderCode) => {
    localStorage.setItem("activeOrderCode", orderCode);
    setError("");
    navigate("/products");
  };

  // Xác nhận hủy đơn hàng qua API cancelCartItem kèm lý do hủy đơn
  const handleConfirmCancel = async () => {
    if (!selectedItem || !cancellationReason) return;
    try {
      await cancelCartItem(selectedItem.order_code, cancellationReason, role);
      await refreshCart();
      setShowCancelModal(false); setSelectedItem(null); setCancellationReason("");
    } catch (e) { console.error(e); setError("Không thể hủy đơn hàng này."); }
  };

  // Xác nhận khách hàng đã nhận được sản phẩm thành công (Giao hàng thành công)
  const handleReceived = async (orderCode) => {
    try { await markCartItemReceived(orderCode); refreshCart(); }
    catch (e) { console.error(e); setError("Không thể cập nhật trạng thái nhận hàng."); }
  };

  // Ánh xạ các trạng thái đơn hàng trong DB sang nhãn tiếng Việt và Class CSS tương ứng
  const STATUS_MAP = {
    pending:   { cls: "dashboard-badge-warning", label: "Đang xử lý" },
    completed: { cls: "dashboard-badge-info",    label: "Đang giao"  },
    received:  { cls: "dashboard-badge-success", label: "Đã giao"    },
    cancelled: { cls: "dashboard-badge-danger",  label: "Đã hủy" },
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        
        {/* Header */}
        <header className="dashboard-header animate-fadeIn">
          <div>
            <h1 className="dashboard-title">
              <span className="dashboard-title-dot" />
              {role === "admin" ? "Quản lý đơn hàng" : "Giỏ hàng của tôi"}
            </h1>
            <p className="dashboard-subtitle">
              {role === "admin" 
                ? "Theo dõi toàn bộ đơn đặt hàng và xử lý vận chuyển của nhà hàng." 
                : "Kiểm tra đơn đang xử lý, thanh toán và xác nhận nhận hàng."}
            </p>
          </div>
          <button className="dashboard-btn dashboard-btn-secondary" onClick={() => navigate("/")}>
            <FaArrowLeft /> Trang chủ
          </button>
        </header>

        {/* Revenue panel for Admin */}
        {role === "admin" && (
          <div className="dashboard-panel animate-fadeInUp" style={{ padding: "var(--space-4) var(--space-5)", display: "flex", alignItems: "center", gap: "16px", marginBottom: "var(--space-4)" }}>
            <div className="dashboard-stat-icon" style={{ background: "var(--color-brand-pale)", color: "var(--color-brand-dark)", borderRadius: "var(--radius-md)" }}>
              <FaChartLine />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-faint)" }}>Tổng doanh thu</p>
              <p className="dashboard-money-primary" style={{ margin: "4px 0 0", fontSize: "2rem" }}>{fmt(totalRevenue)}</p>
            </div>
          </div>
        )}

        {/* Stats / Tabs */}
        {role === "admin" ? (
          <div className="dashboard-stats-grid animate-fadeInUp animate-delay-1">
            {[
              { icon: <FaShoppingCart />, label: "Tổng đơn",   value: groupedOrders.length,  bg: "var(--color-brand-pale)",    color: "var(--color-brand-dark)", accent: "var(--color-brand)" },
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
        ) : (
          <div className="shopee-tabs animate-fadeInUp animate-delay-1">
            {[
              { key: "all",       label: "Tất cả" },
              { key: "pending",   label: "Đang xử lý" },
              { key: "completed", label: "Đang giao" },
              { key: "received",  label: "Đã giao" },
              { key: "cancelled", label: "Đã hủy" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`shopee-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="shopee-tab-badge">({tabCounts[tab.key]})</span>
              </button>
            ))}
          </div>
        )}

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
            <strong>{sortedOrders.length}</strong> đơn hàng
          </span>
        </div>

        {/* Orders Cards Grid */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }} className="animate-fadeInUp animate-delay-2">
          {pagedOrders.length === 0 ? (
            <div className="dashboard-panel" style={{ padding: "var(--space-6) 0" }}>
              <div className="dashboard-empty">
                <div style={{ fontSize: "3rem", opacity: 0.25 }}>🛒</div>
                <h3>Chưa có đơn hàng nào</h3>
                <p>Hãy chọn sản phẩm yêu thích và đặt hàng!</p>
                <button className="dashboard-btn dashboard-btn-primary" onClick={() => navigate("/products")}>
                  Xem sản phẩm
                </button>
              </div>
            </div>
          ) : (
            pagedOrders.map((order) => {
              const st = STATUS_MAP[order.status] || { cls: "dashboard-badge-neutral", label: "N/A" };
              return (
                <div key={order.order_code} className="dashboard-panel commerce-order-panel" style={{ padding: "var(--space-5) var(--space-6)" }}>
                  {/* Card Header */}
                  <div className="commerce-order-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1.5px solid var(--color-border)", paddingBottom: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text)" }}>Đơn hàng #{order.order_code}</span>
                        <span className={`dashboard-badge ${st.cls}`}>{st.label}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-text-faint)", fontWeight: 500 }}>
                        Ngày đặt: {new Date(order.order_date).toLocaleString("vi-VN")}
                      </p>
                      {role === "admin" && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-brand-dark)", fontWeight: 700 }}>
                          Khách hàng: {order.user_name} ({order.user_email})
                        </p>
                      )}
                    </div>
                    
                    {/* Action buttons on Header for desktop */}
                    <div className="commerce-order-actions" style={{ display: "flex", gap: "8px" }}>
                      {role === "user" && order.status === "pending" && (
                        <>
                          <button className="dashboard-btn dashboard-btn-primary" onClick={() => handleCheckout(order)}>
                            <FaCreditCard /> Thanh toán
                          </button>
                          <button className="dashboard-btn dashboard-btn-success" style={{ background: "var(--color-brand)", color: "white" }} onClick={() => handleAddMoreItems(order.order_code)}>
                            <FaPlus /> Thêm món
                          </button>
                          <button className="dashboard-btn dashboard-btn-danger" onClick={() => { setSelectedItem(order); setShowCancelModal(true); }}>
                            <FaTimes /> Hủy đơn
                          </button>
                        </>
                      )}
                      
                      {role === "user" && order.status === "completed" && (
                        <>
                          <button className="dashboard-btn dashboard-btn-success" onClick={() => handleReceived(order.order_code)}>
                            <FaCheck /> Đã nhận hàng
                          </button>
                          <button className="dashboard-btn dashboard-btn-danger" onClick={() => { setSelectedItem(order); setShowCancelModal(true); }}>
                            <FaTimes /> Hủy
                          </button>
                        </>
                      )}

                      {role === "admin" && !["cancelled", "received"].includes(order.status) && (
                        <button className="dashboard-btn dashboard-btn-danger" onClick={() => { setSelectedItem(order); setShowCancelModal(true); }}>
                          <FaTimes /> Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body (Products list) */}
                  <div className="commerce-order-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {order.items.map((item) => (
                      <div key={item.id} className="commerce-order-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                        <div className="commerce-order-item-left" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <ProductImage src={item.image} alt={item.name} style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", objectFit: "cover" }} />
                          <div>
                            <div className="commerce-order-item-name" style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text)" }}>{item.name}</div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "4px" }}>
                              <span className="dashboard-code">{item.code || "SP"}</span>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-faint)", background: "var(--color-bg-alt)", padding: "2px 8px", borderRadius: 4 }}>Size: {item.size}</span>
                              {(item.sugar || item.ice) && (
                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-brand-dark)", background: "rgba(139, 90, 43, 0.08)", padding: "2px 8px", borderRadius: 4 }}>
                                  {item.sugar ? item.sugar : ""} {item.ice ? `| ${item.ice}` : ""}
                                </span>
                              )}
                            </div>
                            {Array.isArray(item.toppings) && item.toppings.length > 0 && (
                              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px", fontWeight: 500 }}>
                                <strong>Topping:</strong> {item.toppings.map(t => `${t.name} (+${fmt(t.price)})`).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="commerce-order-item-right" style={{ display: "flex", alignItems: "center", gap: "32px", marginLeft: "auto", flexWrap: "wrap" }}>
                          <div className="commerce-order-stat-block price-block" style={{ textAlign: "right" }}>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-faint)", fontWeight: 700, textTransform: "uppercase" }}>Đơn giá</span>
                            <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>{fmt(item.price)}</span>
                          </div>

                          <div className="commerce-order-stat-block qty-block" style={{ textAlign: "center" }}>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-faint)", fontWeight: 700, textTransform: "uppercase" }}>Số lượng</span>
                            {order.status === "pending" && role === "user" ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                                <button 
                                  onClick={() => handleQuantityChange(item.id, Number(item.quantity) - 1)}
                                  disabled={Number(item.quantity) <= 1}
                                  style={{ 
                                    width: "28px", height: "28px", borderRadius: "50%", 
                                    border: "1px solid var(--color-border)", background: "var(--color-bg)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: Number(item.quantity) <= 1 ? "not-allowed" : "pointer", 
                                    fontWeight: "bold", fontSize: "14px",
                                    color: "var(--color-text)", transition: "all 0.2s"
                                  }}
                                >
                                  -
                                </button>
                                <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 700, fontSize: "0.95rem" }}>
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => handleQuantityChange(item.id, Number(item.quantity) + 1)}
                                  style={{ 
                                    width: "28px", height: "28px", borderRadius: "50%", 
                                    border: "1px solid var(--color-border)", background: "var(--color-bg)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", fontWeight: "bold", fontSize: "14px",
                                    color: "var(--color-text)", transition: "all 0.2s"
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.92rem", fontWeight: 600 }}>{item.quantity}</span>
                            )}
                          </div>

                          <div className="commerce-order-stat-block subtotal-block" style={{ textAlign: "right", minWidth: 120, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px" }}>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-faint)", fontWeight: 700, textTransform: "uppercase" }}>Thành tiền</span>
                              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-brand-dark)" }}>
                                {fmt((Number(item.price) + (Array.isArray(item.toppings) ? item.toppings.reduce((sum, t) => sum + Number(t.price || 0), 0) : 0)) * Number(item.quantity))}
                              </span>
                            </div>
                            {order.status === "pending" && role === "user" && (
                              <button 
                                onClick={() => handleRemoveItem(item.id)}
                                style={{ 
                                  background: "none", border: "none", color: "var(--color-danger)", 
                                  cursor: "pointer", padding: "4px 8px", fontSize: "1.1rem", display: "flex", alignItems: "center",
                                  marginTop: "12px"
                                }}
                                title="Xóa món này"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="commerce-order-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1.5px dashed var(--color-border)", marginTop: "var(--space-4)", paddingTop: "var(--space-3)", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-faint)", fontWeight: 700 }}>TỔNG ĐƠN HÀNG:</span>
                      <span style={{ marginLeft: 8, fontSize: "1.35rem", fontWeight: 900, color: "var(--color-brand-dark)" }}>{fmt(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ── Recommendations carousel for User ── */}
        {role === "user" && recommendations.length > 0 && (
          <div className="recommendations-section animate-fadeInUp" style={{ marginTop: "var(--space-4)", animationDelay: "0.15s" }}>
            <div className="recommendations-header">
              <h2 className="recommendations-title">
                <span>💡 Gợi ý thêm cho bạn</span>
              </h2>
              <div className="carousel-controls">
                <button 
                  type="button" 
                  className="carousel-arrow" 
                  onClick={() => {
                    const carousel = document.getElementById("cart-reco-carousel-list");
                    if (carousel) carousel.scrollLeft -= 220;
                  }}
                  aria-label="Xem sản phẩm trước"
                >
                  <FaChevronLeft size={12} />
                </button>
                <button 
                  type="button" 
                  className="carousel-arrow" 
                  onClick={() => {
                    const carousel = document.getElementById("cart-reco-carousel-list");
                    if (carousel) carousel.scrollLeft += 220;
                  }}
                  aria-label="Xem sản phẩm tiếp theo"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
            
            <div className="recommendations-carousel-wrapper">
              <div id="cart-reco-carousel-list" className="recommendations-carousel">
                {recommendations.map((item) => {
                  const isQuickAddSuccess = quickAddSuccessId === item.id;
                  return (
                    <div 
                      key={item.id} 
                      className="reco-card"
                      onClick={() => navigate(`/products/${item.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="reco-img-wrap">
                        <ProductImage 
                          src={item.image} 
                          alt={item.name} 
                          className="reco-img"
                        />
                        {item.category && (
                          <span className="reco-badge">{item.category}</span>
                        )}
                      </div>
                      <div className="reco-body">
                        <h4 className="reco-name" title={item.name}>{item.name}</h4>
                        <p className="reco-desc" title={item.description || ""}>
                          {item.description || "Món dùng kèm thơm ngon, đậm đà rất đáng thử."}
                        </p>
                        <div className="reco-footer">
                          <div className="reco-price-wrap">
                            <span className="reco-price">{fmt(item.price)}</span>
                            {item.size && (
                              <span className="reco-size">Size {item.size}</span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            className={`reco-quick-add-btn ${isQuickAddSuccess ? "success" : ""}`}
                            onClick={(e) => handleQuickAdd(item, e)}
                            title="Thêm nhanh vào giỏ"
                          >
                            {isQuickAddSuccess ? <FaCheck /> : <FaPlus />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {role === "user" && pendingItems.length > 0 && (
          <div className="dashboard-panel animate-fadeInUp" style={{ padding: "var(--space-5) var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "4px solid var(--color-brand)", marginTop: "var(--space-4)" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-faint)", fontWeight: 700, textTransform: "uppercase" }}>Tổng thanh toán tất cả ({pendingItems.length} sản phẩm)</p>
              <p style={{ margin: "4px 0 0", fontSize: "1.75rem", fontWeight: 800, color: "var(--color-brand-dark)" }}>{fmt(totalPendingAmount)}</p>
            </div>
            <button className="btn-brand" onClick={handleCheckoutAll} style={{ padding: "12px 32px", fontSize: "0.95rem" }}>
              <FaCreditCard /> Thanh toán toàn bộ ({pendingItems.length})
            </button>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedOrders.length}
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

      {customizingProduct && (
        <ProductCustomizationModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={async (customData) => {
            setCustomizingProduct(null);
            try {
              const activeCode = localStorage.getItem("activeOrderCode");
              await addToCart(
                userId,
                customData.product.id,
                customData.quantity,
                customData.product.size || "M",
                activeCode,
                customData.sugar,
                customData.ice,
                customData.toppings
              );
              
              addNotification(
                "new_order",
                "🛒 Giỏ hàng",
                `Đã thêm "${customData.product.name}" vào giỏ hàng thành công!`
              );
              
              setQuickAddSuccessId(customData.product.id);
              setTimeout(() => setQuickAddSuccessId(null), 1500);
              refreshCart();
              
              // Thêm bánh ngọt đi kèm nếu có
              if (customData.accompaniments && customData.accompaniments.length > 0) {
                for (const acc of customData.accompaniments) {
                  await addToCart(userId, acc.id, 1, acc.size || "M", activeCode);
                }
              }
            } catch (err) {
              console.error(err);
              addNotification("error", "⚠️ Lỗi", "Không thể thêm sản phẩm vào giỏ hàng.");
            }
          }}
        />
      )}
    </div>
  );
};

export default Cart;
