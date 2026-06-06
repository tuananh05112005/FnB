// ==============================================================
// TÊN FILE: Sidebar.js
// MÔ TẢ: Hợp phần thanh điều hướng bên (Sidebar) của toàn bộ ứng dụng.
//        - Phân chia danh mục chức năng theo quyền hạn người dùng (Admin, Staff, User).
//        - Lấy cấu hình hiển thị danh mục sản phẩm real-time từ API.
//        - Hỗ trợ giao diện Responsive trên Desktop và Mobile.
// ==============================================================

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

// Component Sidebar chính nhận trạng thái đóng/mở làm thuộc tính
const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  // Định nghĩa các trạng thái giao diện và phiên đăng nhập
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992); // Nhận diện thiết bị PC/Desktop
  const [isLoggedIn, setIsLoggedIn] = useState(false);                 // Trạng thái đã đăng nhập
  const [isAccountOpen, setIsAccountOpen] = useState(false);           // Toggle danh sách tài khoản
  const [isProductOpen, setIsProductOpen] = useState(false);           // Toggle danh sách món ăn
  const [userRole, setUserRole] = useState("");                         // Vai trò của người dùng (admin/staff/user)
  const [categories, setCategories] = useState([]);                     // Danh sách phân loại sản phẩm
  const categorySettings = useCategorySettings();                       // Hook tùy chỉnh thứ tự danh mục
  const menuSettings = useMenuSettings();                               // Hook cấu hình tên quán & banner

  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Effect 1: Theo dõi kích thước màn hình để tự động cập nhật ẩn/hiện Sidebar tương ứng
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

  // Effect 2: Đồng bộ phiên đăng nhập (token, vai trò người dùng) khi mở trang hoặc thay đổi Storage
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

  // Effect 3: Tải danh mục sản phẩm từ backend để hiển thị trên Sidebar
  useEffect(() => {
    api
      .get("/api/product-categories")
      .then((response) => setCategories(response.data))
      .catch((error) => console.error("Failed to load categories:", error));
  }, []);

  // Effect 4: Tự động mở danh sách danh mục nếu đường dẫn bắt đầu bằng "/products"
  useEffect(() => {
    setIsProductOpen(location.pathname.startsWith("/products"));
  }, [location.pathname]);

  // Effect 5: Đóng Sidebar khi nhấp chuột ra ngoài cửa sổ menu trên giao diện di động
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

  // Đóng Sidebar dành cho thiết bị di động
  const closeMobileSidebar = () => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  // Xử lý sự kiện đăng xuất: xóa phiên, chuyển hướng về trang Đăng nhập
  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setUserRole("");
    closeMobileSidebar();
    navigate("/login");
  };

  const baseItems = useMemo(
    () =>
      [
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
      id={to === "/carts" ? "sidebar-cart-btn" : undefined}
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
