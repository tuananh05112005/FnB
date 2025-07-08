import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();
  const alertShownRef = useRef(false); // chỉ cho alert 1 lần duy nhất

  useEffect(() => {
    if ((!token || !allowedRoles.includes(role)) && !alertShownRef.current) {
      alert("Bạn không có quyền truy cập trang này!");
      alertShownRef.current = true; // chặn hiển thị lại
    }
  }, [token, role, allowedRoles]);

  if (!token || !allowedRoles.includes(role)) {
    return <Navigate to="/products" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
