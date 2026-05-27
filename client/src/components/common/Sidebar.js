import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Coffee,
  Gift,
  History,
  Home,
  LogIn,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { FaHeart } from "react-icons/fa";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import "./Sidebar.css";
import { useCategorySettings } from "../../hooks/useCategorySettings";
import { useMenuSettings } from "../../hooks/useMenuSettings";
import { applyCategorySettings } from "../../lib/categorySettings";
import { api } from "../../lib/api";
import { clearSession, decodeTokenPayload, getSession } from "../../lib/session";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [categories, setCategories] = useState([]);
  const categorySettings = useCategorySettings();
  const menuSettings = useMenuSettings();

  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateViewport = () => {
      const desktop = window.innerWidth >= 992;
      setIsDesktop(desktop);
      setIsSidebarOpen(desktop);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    const syncSession = () => {
      const session = getSession();
      const payload = decodeTokenPayload(session.token);

      setIsLoggedIn(Boolean(session.token));
      setUserRole(payload?.role || session.role || "");
    };

    syncSession();
    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  useEffect(() => {
    api
      .get("/api/product-categories")
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Failed to load categories:", error));
  }, []);

  useEffect(() => {
    setIsProductOpen(location.pathname.startsWith("/products"));
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !isDesktop &&
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDesktop, isSidebarOpen, setIsSidebarOpen]);

  const closeMobileSidebar = () => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setUserRole("");
    closeMobileSidebar();
    navigate("/login");
  };

  const baseItems = useMemo(
    () => [
      { to: "/", label: "Trang chủ", icon: Home, accent: "purple" },
      { to: "/carts", label: "Giỏ hàng", icon: ShoppingCart, accent: "green" },
      userRole === "admin"
        ? { to: "/admin/statistics", label: "Thống kê", icon: BarChart3, accent: "amber" }
        : null,
      userRole === "admin"
        ? { to: "/admin/staffs", label: "Quản lý nhân viên", icon: Users, accent: "pink" }
        : null,
      userRole === "admin" || userRole === "staff"
        ? { to: "/orders", label: "Lịch sử giao dịch", icon: History, accent: "violet" }
        : null,
      userRole === "user"
        ? { to: "/history", label: "Lịch sử giao dịch", icon: History, accent: "violet" }
        : null,
      userRole === "user"
        ? { to: "/favorite-products", label: "Yêu thích", icon: FaHeart, accent: "rose" }
        : null,
      userRole === "user" || userRole === "admin"
        ? { to: "/wallet", label: "Ưu đãi", icon: Gift, accent: "gold" }
        : null,
      userRole === "admin" || userRole === "staff" || userRole === "user"
        ? { to: "/admin/settings", label: "Cài đặt", icon: Settings, accent: "slate" }
        : null,  
    ].filter(Boolean),
    [userRole]
  );

  const accountItems = isLoggedIn
    ? [{ type: "action", label: "Đăng xuất", icon: LogOut, onClick: handleLogout }]
    : [
        { to: "/login", label: "Đăng nhập", icon: LogIn },
        { to: "/register", label: "Đăng ký", icon: UserPlus },
      ];

  const visibleCategories = useMemo(
    () => applyCategorySettings(categories, categorySettings),
    [categories, categorySettings]
  );

  const renderNavItem = ({ to, label, icon: Icon, accent }) => (
    <NavLink
      key={to}
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `sidebar-nav-link ${isActive ? "sidebar-nav-link-active" : ""}`
      }
      onClick={closeMobileSidebar}
    >
      <span className={`sidebar-nav-icon sidebar-accent-${accent}`}>
        <Icon size={16} />
      </span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="sidebar-shell">
      {!isDesktop && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar-modern ${isSidebarOpen ? "open" : ""} ${
          isDesktop ? "desktop" : "mobile"
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Coffee size={16} />
          </div>
          <div className="sidebar-brand">
            <h5>{menuSettings.storeName}</h5>
            <small>Quản lý cửa hàng</small>
          </div>

          {!isDesktop && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Đóng menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {renderNavItem(baseItems[0])}

          <div className="sidebar-dropdown-wrap">
            <button
              type="button"
              className={`sidebar-dropdown-toggle ${
                location.pathname.startsWith("/products") ? "sidebar-nav-link-active" : ""
              }`}
              onClick={() => setIsProductOpen((previous) => !previous)}
            >
              <div className="sidebar-dropdown-label">
                <span className="sidebar-nav-icon sidebar-accent-blue">
                  <Package size={16} />
                </span>
                <span>Sản phẩm</span>
              </div>
              <ChevronDown size={16} className={isProductOpen ? "rotated" : ""} />
            </button>
            <div className={`sidebar-dropdown-menu ${isProductOpen ? "show" : ""}`}>
              <NavLink to="/products" className="sidebar-dropdown-item" onClick={closeMobileSidebar}>
                Tất cả sản phẩm
              </NavLink>
              {visibleCategories.map((category) => (
                <NavLink
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="sidebar-dropdown-item"
                  onClick={closeMobileSidebar}
                >
                  {category}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="sidebar-dropdown-wrap">
            <button
              type="button"
              className="sidebar-dropdown-toggle"
              onClick={() => setIsAccountOpen((previous) => !previous)}
            >
              <div className="sidebar-dropdown-label">
                <span className="sidebar-nav-icon sidebar-accent-cyan">
                  <User size={16} />
                </span>
                <span>Tài khoản</span>
              </div>
              <ChevronDown size={16} className={isAccountOpen ? "rotated" : ""} />
            </button>
            <div className={`sidebar-dropdown-menu ${isAccountOpen ? "show" : ""}`}>
              {accountItems.map((item) =>
                item.type === "action" ? (
                  <button
                    key={item.label}
                    type="button"
                    className="sidebar-dropdown-item sidebar-dropdown-action"
                    onClick={item.onClick}
                  >
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="sidebar-dropdown-item"
                    onClick={closeMobileSidebar}
                  >
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </NavLink>
                )
              )}
            </div>
          </div>

          <div className="sidebar-divider" />

          {baseItems.slice(1).map(renderNavItem)}
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
