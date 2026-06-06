// ==============================================================
// TÊN FILE: PrivateRoute.js
// MÔ TẢ: Hợp phần bảo vệ tuyến đường định tuyến (Route Guard).
//        Ngăn chặn các truy cập trái phép của khách chưa đăng nhập (không có token)
//        hoặc người dùng không có vai trò hợp lệ (không thuộc allowedRoles),
//        tự động chuyển hướng về trang Đăng nhập hoặc trang Sản phẩm.
// ==============================================================

import { Navigate, useLocation } from "react-router-dom";
import { getRole, getToken } from "../lib/session";

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = getToken();
  const role = getRole();
  const location = useLocation();

  // Nếu chưa đăng nhập, chuyển hướng sang trang /login kèm vị trí cũ để quay lại sau khi đăng nhập
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu vai trò (role) của tài khoản không được cấp phép, chuyển hướng về trang danh sách sản phẩm
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/products" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
