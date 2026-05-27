import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";

import "./App.css";
import Sidebar from "./components/common/Sidebar";
import { useMenuSettings } from "./hooks/useMenuSettings";
import { decodeTokenPayload, getSession } from "./lib/session";
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

const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password", "/logout"]);

/* ── Dark mode hook ─────────────────────────────────────────────── */
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

/* ── App Content ────────────────────────────────────────────────── */
const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 992);
  const [isDark, toggleDark] = useDarkMode();
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.has(location.pathname);
  const menuSettings = useMenuSettings();

  const currentUser = useMemo(() => {
    const session = getSession();
    const payload = decodeTokenPayload(session.token);
    const name = payload?.name || session.name || payload?.email || "User";
    return {
      name,
      initial: name.charAt(0).toUpperCase(),
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
        <header className="app-topbar">
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

          {/* Search bar */}
          <div className="app-search-wrap">
            <Search className="app-search-icon" size={16} />
            <input
              type="search"
              className="app-search-input"
              placeholder="Tìm kiếm sản phẩm..."
              aria-label="Tìm kiếm"
            />
          </div>

          <div className="app-topbar-right">
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
            <button type="button" className="app-icon-btn app-icon-btn-notify" aria-label="Thông báo">
              <Bell size={18} />
              <span className="app-notify-dot" />
            </button>

            {/* Avatar */}
            <div className="app-user-pill" title={currentUser.name}>
              {currentUser.initial}
            </div>
          </div>
        </header>

        {/* ── Routes ── */}
        <div className="app-content">
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
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <GlobalStyle />
    <AppContent />
  </Router>
);

export default App;
