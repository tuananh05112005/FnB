import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  Package,
  User,
  ShoppingCart,
  BarChart3,
  History,
  ChevronDown,
  LogOut,
  LogIn,
  UserPlus,
  Coffee,
  Apple,
  Cookie,
  Milk,
  Menu,
  X,
} from "lucide-react";
import axios from "axios";
import { useLocation } from "react-router-dom";

// import "../Sidebar.css"; // Import file CSS cho Sidebar
const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [categories, setCategories] = useState([]);

  

  const dropdownRef = useRef(null);
  const productDropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  const location = useLocation();

// useEffect(() => {
//   // Tự động mở dropdown sản phẩm nếu đang ở trang /products
//   if (location.pathname.includes("/products")) {
//     setIsProductDropdownOpen(true);
//   }
// }, [location]);

useEffect(() => {
  const updateViewMode = () => {
    const isNowDesktop = window.innerWidth >= 992;
    setIsDesktop(isNowDesktop);
    setIsSidebarOpen(isNowDesktop);
  };

  updateViewMode(); 
  window.addEventListener("resize", updateViewMode);
  return () => window.removeEventListener("resize", updateViewMode);
}, []);

useEffect(() => {
  axios.get(`http://localhost:5000/api/product-categories`).then((res) => {
    setCategories(res.data);
    console.log("Fetched categories:", res.data); // 👈 thêm dòng này
  });
}, []);


  

  // Theo dõi kích thước màn hình và set trạng thái sidebar
useEffect(() => {
  const token = localStorage.getItem("token");
  setIsLoggedIn(!!token);

  
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUserRole(payload.role);
  }
}, []);


  // Kiểm tra trạng thái đăng nhập
  // useEffect(() => {
  //   const checkLoginStatus = () => {
  //     const token = Math.random() > 0.5;
  //     setIsLoggedIn(!!token);
  //   };

  //   checkLoginStatus();
  //   const interval = setInterval(checkLoginStatus, 5000);
  //   return () => clearInterval(interval);
  // }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      
      // Chỉ đóng sidebar khi click bên ngoài trên mobile
      if (!isDesktop && isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        const toggleButton = document.querySelector('.sidebar-toggle-btn');
        if (toggleButton && !toggleButton.contains(event.target)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, isDesktop]);

  // Xử lý ESC để đóng sidebar (chỉ trên mobile)
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isSidebarOpen && !isDesktop) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSidebarOpen, isDesktop]);
  useEffect(() => {
  const handleStorageChange = () => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);


  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleProductDropdown = () => setIsProductDropdownOpen(!isProductDropdownOpen);
const toggleSidebar = () => {
  setIsSidebarOpen(!isSidebarOpen);
};


const handleLogout = () => {
  localStorage.removeItem("token");
  setIsLoggedIn(false);
  alert("Đăng xuất thành công!");
  window.location.reload(); // Reload lại để cập nhật sidebar
};



  // Xử lý khi click vào nav link
  const handleNavLinkClick = () => {
    // Chỉ đóng sidebar khi click vào nav link trên mobile
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
    // Đóng các dropdown nếu đang mở
    setIsDropdownOpen(false);
    setIsProductDropdownOpen(false);
  };

  const NavLink = ({ to, children, icon: Icon, className = "" }) => (
    <a 
      href={to || "#"} 
      className={`nav-link ${className}`}
      onClick={handleNavLinkClick}
    > 
      <Icon size={18} />
      <span className="nav-text">{children}</span>
    </a>
  );

  const DropdownLink = ({ to, children, icon: Icon }) => (
    <a
      href={to || "#"}
      className="dropdown-item d-flex align-items-center gap-2"
      onClick={handleNavLinkClick}
    >
      <Icon size={16} />
      <span>{children}</span>
    </a>
  );

  return (
    <div className="sidebar-container">
      {/* Overlay - chỉ hiển thị trên mobile */}
      {isSidebarOpen && !isDesktop && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="sidebar-toggle-btn"
        aria-label={isSidebarOpen ? "Đóng menu" : "Mở menu"}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`sidebar-modern ${isSidebarOpen ? 'open' : ''} ${isDesktop ? 'desktop' : 'mobile'}`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Coffee size={20} />
          </div>
          <div className="sidebar-brand">
            <h5>TeaShop</h5>
            <small>Quản lý cửa hàng</small>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <NavLink to="/" icon={Home}>Trang chủ</NavLink>

          {/* Product Dropdown */}
          <div className="dropdown-wrapper" ref={productDropdownRef}>
            <button 
              className="dropdown-toggle" 
              onClick={toggleProductDropdown}
              aria-expanded={isProductDropdownOpen}
            >
              <div className="dropdown-toggle-content">
                <Package size={18}/>
                <span className="nav-text">Sản phẩm</span>
              </div>
              <ChevronDown className={`chevron ${isProductDropdownOpen ? 'rotate' : ''}`} size={16}/>
            </button>
            
           <div className={`dropdown-menu ${isProductDropdownOpen ? 'show' : ''}`}>
  <DropdownLink to="/products" icon={Package}>Tất cả sản phẩm</DropdownLink>
  {categories.map((cat, idx) => {
    const iconMap = {
      "Trà trái cây": Apple,
      "Cà phê": Coffee,
      "Trà sữa": Milk,
      "Sinh tố": Coffee,
      "Bánh": Cookie,
    };
    const Icon = iconMap[cat] || Package;
    return (
      <DropdownLink
        key={idx}
        to={`/products?category=${encodeURIComponent(cat)}`}
        icon={Icon}
      >
        {cat}
      </DropdownLink>
    );
  })}
</div>

          </div>

          {/* Account Dropdown */}
          <div className="dropdown-wrapper" ref={dropdownRef}>
            <button 
              className="dropdown-toggle" 
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
            >
              <div className="dropdown-toggle-content">
                <User size={18}/>
                <span className="nav-text">Tài khoản</span>
              </div>
              <ChevronDown className={`chevron ${isDropdownOpen ? 'rotate' : ''}`} size={16}/>
            </button>
            
            <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
              {!isLoggedIn ? (
                <>
                  <DropdownLink to="/login" icon={LogIn}>Đăng nhập</DropdownLink>
                  <DropdownLink to="/register" icon={UserPlus}>Đăng ký</DropdownLink>
                </>
              ) : (
                <button 
                  onClick={() => {
                    handleLogout();
                    handleNavLinkClick();
                  }} 
                  className="dropdown-item logout-btn"
                >
                  <LogOut size={16}/>
                  <span className="nav-text">Đăng xuất</span>
                </button>
              )}
            </div>
          </div>

          <div className="nav-divider"></div>

          <NavLink to="/carts" icon={ShoppingCart}>Giỏ hàng</NavLink>
          <NavLink to="/admin/statistics" icon={BarChart3}>Thống kê</NavLink>
          {userRole === "admin" && (
  <>
    <NavLink to="/admin/staffs" icon={User}>
      Quản lý nhân viên
    </NavLink>
    {/* <NavLink to="/admin/create-staff" icon={UserPlus}>
      Thêm nhân viên
    </NavLink> */}
  </>
)}
{(userRole === "admin" || userRole === "staff") && (
  <>
    <NavLink to="/orders" icon={History}>Lịch sử giao dịch</NavLink>
  </>
)}
           {userRole === "user" && (
  <>
          <NavLink to="/history" icon={History}>Lịch sử mua hàng</NavLink>
             </> )}
     
        </nav>




        {/* Footer */}
        <div className="sidebar-footer">
          <div className="status-indicator">
            <div className={`status-dot ${isLoggedIn ? 'online' : 'offline'}`}></div>
            <span className="status-text">{isLoggedIn ? 'Đã đăng nhập' : 'Chưa đăng nhập'}</span>
          </div>
          <span className="version">v1.0.0</span>
        </div>
      </aside>

      {/* Demo Content */}
     
    <style>{`
        /* Container */
        .sidebar-container {
          position: relative;
          display: flex;
          min-height: 100vh;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Điều chỉnh main content khi sidebar mở trên desktop */
        @media (min-width: 992px) {
          .main-content.sidebar-open {
            margin-left: 280px;
          }
        }

        .content-header {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }

        .content-header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .content-header p {
          font-size: 1.25rem;
          opacity: 0.9;
        }

        .demo-sections {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .section h2 {
          color: #fbbf24;
          font-size: 2rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          color: white;
          transition: transform 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-5px);
        }

        .product-card h3 {
          margin: 1rem 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .product-card p {
          opacity: 0.8;
        }

        /* Sidebar Base Styles */
        .sidebar-modern {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 280px;
          background: linear-gradient(to bottom, #1e293b, #0f172a);
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
          color: #e2e8f0;
          z-index: 1040;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Mobile: Sidebar ẩn mặc định */
        .sidebar-modern.mobile {
          transform: translateX(-100%);
        }

        .sidebar-modern.mobile.open {
          transform: translateX(0);
        }

        /* Desktop: Sidebar hiển thị mặc định */
        .sidebar-modern.desktop {
          transform: translateX(-100%);
        }
             .sidebar-modern.desktop.open {
          transform: translateX(0);
        }

     
        /* Toggle Button */
        .sidebar-toggle-btn {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1050;
          background: #1e293b;
          border: none;
          color: white;
          padding: 0.75rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .sidebar-toggle-btn:hover {
          background: #334155;
          transform: scale(1.05);
        }

        /* Overlay - chỉ hiển thị trên mobile */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1039;
          backdrop-filter: blur(2px);
        }

        /* Sidebar Header */
        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 80px;
        }

        .sidebar-logo {
          background: #3b82f6;
          padding: 0.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-brand h5 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .sidebar-brand small {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          margin-bottom: 0.5rem;
          border-radius: 0.5rem;
          color: #e2e8f0;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(8px);
          padding-left: 1.25rem;
          margin-left: 0.25rem;
        }

        /* Dropdown Styles */
        .dropdown-wrapper {
          margin-bottom: 0.5rem;
        }

        .dropdown-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateX(4px);
          margin-left: 0.125rem;
        }

        .dropdown-toggle-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .chevron {
          transition: transform 0.2s ease;
        }

        .chevron.rotate {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          background: rgba(30, 41, 59, 0.95);
          border-radius: 0.5rem;
          padding: 0.5rem;
          margin-top: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .dropdown-menu.show {
          max-height: 300px;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          border-radius: 0.375rem;
          color: #e2e8f0;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transform: translateX(6px);
          padding-left: 1.25rem;
        }

        .logout-btn {
          color: #ef4444;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          transform: translateX(6px);
          padding-left: 1.25rem;
        }

        /* Divider */
        .nav-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 1rem 0;
        }

        /* Footer */
        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6b7280;
        }

        .status-dot.online {
          background: #10b981;
        }

        .status-text {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .version {
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Responsive adjustments */
        @media (max-width: 576px) {
          .sidebar-modern {
            width: 100%;
            max-width: 320px;
          }

          .content-header h1 {
            font-size: 2rem;
          }

          .product-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 577px) and (max-width: 991px) {
          .sidebar-modern {
            max-width: 280px;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
          }
        }

        /* Scrollbar styling */
        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
  
    </div>
  );
};

export default Sidebar;