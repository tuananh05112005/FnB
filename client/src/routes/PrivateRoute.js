import { Navigate, useLocation } from "react-router-dom";

import { getRole, getToken } from "../lib/session";

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = getToken();
  const role = getRole();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/products" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
