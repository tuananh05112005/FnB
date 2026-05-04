import { useMemo, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { Bell, Menu, Search } from "lucide-react";

import "./App.css";
import Sidebar from "./components/common/Sidebar";
import { decodeTokenPayload, getSession } from "./lib/session";
import { GlobalStyle } from "./styles/theme";
import AddProductForm from "./pages/admin/AddProductForm";
import AdminStatistics from "./pages/admin/AdminStatistics";
import EditProductForm from "./pages/admin/EditProductForm";
import OrderList from "./pages/admin/OrderList";
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

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 992);
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.has(location.pathname);

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

      <div
        className={`app-main ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="app-menu-btn"
              onClick={() => setIsSidebarOpen((previous) => !previous)}
              aria-label="Mo hoac dong menu"
            >
              <Menu size={18} />
            </button>
            <span className="app-topbar-title">TeaShop</span>
          </div>

          <div className="app-topbar-right">
            <button type="button" className="app-icon-btn" aria-label="Tim kiem">
              <Search size={18} />
            </button>
            <button type="button" className="app-icon-btn app-icon-btn-notify" aria-label="Thong bao">
              <Bell size={18} />
              <span className="app-notify-dot" />
            </button>
            <div className="app-user-pill">{currentUser.initial}</div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/carts" element={<Cart />} />
          <Route path="/payment" element={<PaymentPage />} />

          <Route
            path="/admin/statistics"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminStatistics />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-product"
            element={
              <PrivateRoute allowedRoles={["admin", "staff"]}>
                <AddProductForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit-product/:id"
            element={
              <PrivateRoute allowedRoles={["admin", "staff"]}>
                <EditProductForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute allowedRoles={["admin", "staff"]}>
                <OrderList />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/create-staff"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <CreateStaff />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/staffs"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <StaffManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute allowedRoles={["user", "admin", "staff"]}>
                <History />
              </PrivateRoute>
            }
          />
          <Route
            path="/order-detail"
            element={
              <PrivateRoute allowedRoles={["user", "staff", "admin"]}>
                <OrderDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/favorite-products"
            element={
              <PrivateRoute allowedRoles={["user"]}>
                <FavoriteProducts />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <PrivateRoute allowedRoles={["user", "admin"]}>
                <LoyaltyWallet />
              </PrivateRoute>
            }
          />
        </Routes>
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
