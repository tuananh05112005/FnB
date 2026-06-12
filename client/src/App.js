// ==============================================================
// TÊN FILE: App.js
// MÔ TẢ: Điểm khởi đầu cấu hình và định tuyến (routing) của toàn bộ ứng dụng Frontend.
//        Thiết lập các Context Provider (Router, GeminiChatProvider, NotificationProvider),
//        quản lý trạng thái giao diện chính (Sidebar, Hộp thoại thông báo thời gian thực, Dark/Light Mode),
//        và định nghĩa bảng phân tuyến bảo mật (PrivateRoute) cho khách hàng, nhân viên và admin.
// ==============================================================

import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, Moon, Search, Sun, X } from "lucide-react";

import "./App.css";
import Sidebar from "./components/common/Sidebar";
import { useMenuSettings } from "./hooks/useMenuSettings";
import { decodeTokenPayload, getSession, clearSession } from "./lib/session";
import { auth } from "./config/firebase";
import { GlobalStyle } from "./styles/theme";
import AddProductForm from "./pages/admin/AddProductForm";
import AdminStatistics from "./pages/admin/AdminStatistics";
import EditProductForm from "./pages/admin/EditProductForm";
import OrderList from "./pages/admin/OrderList";
import ProductAvailabilitySettings from "./pages/admin/ProductAvailabilitySettings";
import StaffManagement from "./pages/admin/StaffManagement";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import Register from "./pages/auth/Register";
import Cart from "./pages/Cart";
import CreateStaff from "./pages/CreateStaff";
import FavoriteProducts from "./pages/FavoriteProducts";
import History from "./pages/History";
import Home from "./pages/Home";
import LoyaltyWallet from "./pages/LoyaltyWallet";
import OrderDetail from "./pages/OrderDetail";
import PaymentPage from "./pages/PaymentPage";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import PrivateRoute from "./routes/PrivateRoute";
import { GeminiChatProvider } from "./components/chatbot/GeminiChatProvider";
import FloatingActionButton from "./components/chatbot/FloatingActionButton";
import ChatOverlay from "./components/chatbot/ChatOverlay";
import { NotificationProvider, useNotifications } from "./components/common/NotificationContext";

// Khai báo tập hợp các đường dẫn (routes) liên quan đến xác thực (Auth)
const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password", "/logout"]);

/* ── Dark mode hook ─────────────────────────────────────────────── */
/**
 * useDarkMode: Custom hook quản lý trạng thái giao diện tối/sáng (Dark/Light mode).
 * Lưu lựa chọn của người dùng vào LocalStorage và cập nhật thuộc tính 'data-theme' trên thẻ HTML.
 */
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("fnb-theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("fnb-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("fnb-theme", "light");
    }
  }, [isDark]);

  return [isDark, () => setIsDark((prev) => !prev)];
}

/* ── Relative time formatter ────────────────────────────────────── */
/**
 * formatRelativeTime: Định dạng mốc thời gian ISO thành khoảng thời gian tương đối
 * (ví dụ: "Vừa xong", "10 phút trước", "3 giờ trước") hiển thị trên khay thông báo.
 */
const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${diffDay} ngày trước`;
};

/* ── App Content ────────────────────────────────────────────────── */
const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 992);
  const [chatOpen, setChatOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDark, toggleDark] = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeOrderCode, setActiveOrderCode] = useState(() => localStorage.getItem("activeOrderCode"));
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  useEffect(() => {
    setActiveOrderCode(localStorage.getItem("activeOrderCode"));
  }, [location]);
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlSearch = queryParams.get("search") || "";
  const [quickSearch, setQuickSearch] = useState(urlSearch);

  const { history, unreadCount, markAllAsRead, markAsRead, clearHistory, getIcon } = useNotifications();

  useEffect(() => {
    setQuickSearch(urlSearch);
  }, [urlSearch]);

  // Click outside to close notification dropdown
  useEffect(() => {
    if (!isNotifyOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".app-notify-container")) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isNotifyOpen]);

  // Click outside to close user menu dropdown
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".app-user-profile-container")) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isUserMenuOpen]);

  const isAuthPage = AUTH_ROUTES.has(location.pathname);
  const menuSettings = useMenuSettings();

  const currentUser = useMemo(() => {
    // Access location.pathname to trigger re-evaluation on navigation (e.g., after login/logout)
    // eslint-disable-next-line no-unused-vars
    const _path = location.pathname;
    const session = getSession();
    const payload = decodeTokenPayload(session.token);
    const name = payload?.name || session.name || payload?.email || "User";
    return {
      name,
      initial: name.charAt(0).toUpperCase(),
      loggedIn: !!session.token,
    };
  }, [location.pathname]);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className={`app-main ${isSidebarOpen ? "sidebar-open" : ""}`}>
        {/* ── Topbar ── */}
        <header className={`app-topbar ${isMobileSearchActive ? "search-active" : ""}`}>
          {!isMobileSearchActive && (
            <div className="app-topbar-left">
              <button
                type="button"
                className="app-menu-btn"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label="Mở hoặc đóng menu"
              >
                <Menu size={20} />
              </button>
              <span className="app-topbar-title">{menuSettings.topbarName}</span>
            </div>
          )}

          {/* Search bar */}
          <div className={`app-search-wrap ${isMobileSearchActive ? "mobile-active" : ""}`}>
            {isMobileSearchActive && (
              <button
                type="button"
                className="app-search-back-btn"
                onClick={() => setIsMobileSearchActive(false)}
                aria-label="Quay lại"
              >
                <X size={20} />
              </button>
            )}
            <Search className="app-search-icon" size={16} />
            <input
              type="search"
              className="app-search-input"
              placeholder="Tìm kiếm sản phẩm..."
              aria-label="Tìm kiếm"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const term = quickSearch.trim();
                  if (term) {
                    navigate(`/products?search=${encodeURIComponent(term)}`);
                  } else {
                    navigate('/products');
                  }
                  setIsMobileSearchActive(false);
                }
              }}
            />
          </div>

          {!isMobileSearchActive && (
            <div className="app-topbar-right">
              {/* Mobile/Tablet Search Button */}
              <button
                type="button"
                className="app-icon-btn app-mobile-search-trigger"
                onClick={() => setIsMobileSearchActive(true)}
                aria-label="Tìm kiếm nhanh"
                title="Tìm kiếm nhanh"
              >
                <Search size={18} />
              </button>

              {/* Dark mode toggle */}
              <button
                type="button"
                className="app-theme-btn"
                onClick={toggleDark}
                aria-label={isDark ? "Chuyển sáng" : "Chuyển tối"}
                title={isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notification */}
              <div className="app-notify-container">
                <button
                  type="button"
                  className={`app-icon-btn app-icon-btn-notify ${isNotifyOpen ? "active" : ""}`}
                  onClick={() => setIsNotifyOpen((prev) => !prev)}
                  aria-label="Thông báo"
                  title="Thông báo"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="app-notify-badge">{unreadCount}</span>}
                </button>

                {isNotifyOpen && (
                  <div className="app-notify-dropdown">
                    <div className="app-notify-dropdown-header">
                      <h3>Thông báo</h3>
                      <div className="app-notify-dropdown-actions">
                        <button
                          type="button"
                          className="app-notify-action-btn"
                          onClick={markAllAsRead}
                          disabled={unreadCount === 0}
                        >
                          Đọc tất cả
                        </button>
                        <button
                          type="button"
                          className="app-notify-action-btn clear"
                          onClick={clearHistory}
                          disabled={history.length === 0}
                        >
                          Xóa hết
                        </button>
                      </div>
                    </div>

                    <div className="app-notify-dropdown-list">
                      {history.length === 0 ? (
                        <div className="app-notify-dropdown-empty">
                          <Bell size={32} className="empty-icon" />
                          <p>Không có thông báo nào</p>
                        </div>
                      ) : (
                        history.map((n) => (
                          <div
                            key={n.id}
                            className={`app-notify-item ${n.isRead ? "read" : "unread"}`}
                            onClick={() => {
                              markAsRead(n.id);
                            }}
                          >
                            <div className="app-notify-item-icon-wrap">
                              {getIcon(n.type)}
                            </div>
                            <div className="app-notify-item-content">
                              <h4 className="app-notify-item-title">{n.title}</h4>
                              <p className="app-notify-item-msg">{n.message}</p>
                              <span className="app-notify-item-time">{formatRelativeTime(n.createdAt)}</span>
                            </div>
                            {!n.isRead && <span className="app-notify-item-dot" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar & User Dropdown */}
              <div className="app-user-profile-container">
                {currentUser.loggedIn && (
                  <span className="app-user-name-label" onClick={() => setIsUserMenuOpen(prev => !prev)}>
                    Chào, {currentUser.name}
                  </span>
                )}
                <div className="app-user-pill" title={currentUser.loggedIn ? currentUser.name : "Chưa đăng nhập"} onClick={() => setIsUserMenuOpen(prev => !prev)}>
                  {currentUser.loggedIn ? currentUser.initial : "👤"}
                </div>

                {isUserMenuOpen && (
                  <div className="app-user-dropdown animate-fadeInDown">
                    {currentUser.loggedIn ? (
                      <>
                        <div className="app-user-dropdown-header">
                          Tài khoản: {currentUser.name}
                        </div>
                        <button type="button" className="app-user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate("/admin/settings"); }}>
                          👤 Hồ sơ & Cài đặt
                        </button>
                        <button type="button" className="app-user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate("/carts"); }}>
                          📦 Đơn mua
                        </button>
                        <button type="button" className="app-user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate("/wallet"); }}>
                          🎫 Ví Voucher & Điểm
                        </button>
                        <button type="button" className="app-user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate("/history"); }}>
                          💳 Lịch sử thanh toán
                        </button>
                        <button type="button" className="app-user-dropdown-item danger" onClick={() => {
                          setIsUserMenuOpen(false);
                          const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất?");
                          if (confirmLogout) {
                            clearSession();
                            auth.signOut().catch(console.error);
                            alert("Đăng xuất thành công!");
                            navigate("/login");
                          }
                        }} style={{ borderTop: "1px solid var(--color-border-light)", marginTop: "4px", paddingTop: "8px", color: "var(--color-danger)" }}>
                          🚪 Đăng xuất
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="app-user-dropdown-header">
                          Khách hàng
                        </div>
                        <button type="button" className="app-user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate("/login"); }}>
                          🔑 Đăng nhập
                        </button>
                        <button type="button" className="app-user-dropdown-item" onClick={() => { setIsUserMenuOpen(false); navigate("/register"); }}>
                          📝 Đăng ký
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ── Routes ── */}
        <div className="app-content">
          {activeOrderCode && (
            <div className="animate-fadeInDown" style={{
              background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "var(--radius-3)",
              marginBottom: "var(--space-4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "var(--shadow-lg)",
              fontWeight: 500,
              zIndex: 10
            }}>
              <div>
                <span>🛒 Bạn đang ở chế độ <strong>thêm món</strong> cho Đơn hàng <strong>#{activeOrderCode}</strong>.</span>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  className="dashboard-btn" 
                  style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", padding: "6px 16px", fontSize: "0.85rem", cursor: "pointer", borderRadius: "var(--radius-2)" }}
                  onClick={() => navigate("/carts")}
                >
                  Xem đơn hàng
                </button>
                <button 
                  className="dashboard-btn" 
                  style={{ background: "var(--color-danger)", color: "white", border: "none", padding: "6px 16px", fontSize: "0.85rem", cursor: "pointer", borderRadius: "var(--radius-2)" }}
                  onClick={() => {
                    localStorage.removeItem("activeOrderCode");
                    setActiveOrderCode(null);
                  }}
                >
                  Hủy chế độ
                </button>
              </div>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/carts" element={<Cart />} />
            <Route path="/payment" element={<PaymentPage />} />

            <Route path="/admin/statistics" element={
              <PrivateRoute allowedRoles={["admin"]}><AdminStatistics /></PrivateRoute>
            } />
            <Route path="/add-product" element={
              <PrivateRoute allowedRoles={["admin", "staff"]}><AddProductForm /></PrivateRoute>
            } />
            <Route path="/edit-product/:id" element={
              <PrivateRoute allowedRoles={["admin", "staff"]}><EditProductForm /></PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute allowedRoles={["admin", "staff"]}><OrderList /></PrivateRoute>
            } />
            <Route path="/admin/settings" element={
              <PrivateRoute allowedRoles={["admin", "staff", "user"]}><ProductAvailabilitySettings /></PrivateRoute>
            } />
            <Route path="/admin/create-staff" element={
              <PrivateRoute allowedRoles={["admin"]}><CreateStaff /></PrivateRoute>
            } />
            <Route path="/admin/staffs" element={
              <PrivateRoute allowedRoles={["admin"]}><StaffManagement /></PrivateRoute>
            } />
            <Route path="/history" element={
              <PrivateRoute allowedRoles={["user", "admin", "staff"]}><History /></PrivateRoute>
            } />
            <Route path="/order-detail" element={
              <PrivateRoute allowedRoles={["user", "staff", "admin"]}><OrderDetail /></PrivateRoute>
            } />
            <Route path="/favorite-products" element={
              <PrivateRoute allowedRoles={["user"]}><FavoriteProducts /></PrivateRoute>
            } />
            <Route path="/wallet" element={
              <PrivateRoute allowedRoles={["user", "admin"]}><LoyaltyWallet /></PrivateRoute>
            } />
          </Routes>
          {chatOpen && <ChatOverlay onClose={() => setChatOpen(false)} />}
          <FloatingActionButton onClick={() => setChatOpen(true)} />
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <GlobalStyle />
    <GeminiChatProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </GeminiChatProvider>
  </Router>
);

export default App;
