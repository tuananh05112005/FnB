import { useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"; // Thay Switch bằng Routes
// import Header from './components/Header';
import "./App.css";
import Sidebar from "./components/common/Sidebar";
import AddProductForm from "./pages/admin/AddProductForm";
import AdminStatistics from "./pages/admin/AdminStatistics";
import Login from "./pages/auth/Login";
import Cart from "./pages/Cart";
import EditProductForm from "./pages/admin/EditProductForm";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Home from "./pages/Home";
import Logout from "./pages/auth/Logout";
import OrderList from "./pages/admin/OrderList"; // Import OrderList nếu cần sử dụng
import PaymentPage from "./pages/PaymentPage";
import PrivateRoute from "./routes/PrivateRoute"; // Nếu cần sử dụng PrivateRoute
import Products from "./pages/Products";
import Register from "./pages/auth/Register";
import ProductDetail from "./pages/ProductDetail";
import CreateStaff from "./pages/CreateStaff";
import StaffManagement from "./pages/StaffManagement";
import History from "./pages/History"; // Import History nếu cần sử dụng
import OrderDetail from "./pages/OrderDetail"; // Import OrderDetail nếu cần sử dụng

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State để điều khiển Sidebar

  // const toggleSidebar = () => {
  //   setIsSidebarOpen(!isSidebarOpen); // Đảo ngược trạng thái Sidebar
  // };

  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* /* Truyền state xuống Sidebar */}
        <div
          style={{
            flex: 1,
            marginLeft: isSidebarOpen ? 280 : 0,
            transition: "margin 0.3s ease",
          }}
        >
          {/* <Header toggleSidebar={toggleSidebar} /> Truyền hàm toggleSidebar xuống Header */}
          <Routes>
            {/* Sử dụng element thay vì component */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/carts" element={<Cart />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/admin/statistics" element={ <PrivateRoute allowedRoles={["admin"]}> <AdminStatistics /> </PrivateRoute>} />
            <Route path="/add-product" element={<AddProductForm />} />
            <Route path="/edit-product/:id" element={<EditProductForm />} />
            <Route path="/orders" element={<PrivateRoute allowedRoles={["admin", "staff"]}> <OrderList /></PrivateRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/admin/create-staff" element={<PrivateRoute allowedRoles={["admin"]}> <CreateStaff /> </PrivateRoute>} />
            <Route path="/admin/staffs" element={<PrivateRoute allowedRoles={["admin"]}> <StaffManagement /> </PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute allowedRoles={["user", "admin", "staff"]}> <History /> </PrivateRoute>} />
            <Route path="/order-detail" element={<PrivateRoute allowedRoles={["user", "staff", "admin"]}> <OrderDetail /> </PrivateRoute>} />
    
            {/* Thêm các route khác nếu cần */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
