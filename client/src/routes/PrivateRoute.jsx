import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * PrivateRoute protects routes based on authentication and allowed user roles.
 * It expects a JWT token stored in localStorage under the key "token" and a
 * "role" field inside the token payload (decoded on the client side). For simplicity
 * we just read a "role" value also stored in localStorage.
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); // e.g., "admin", "staff", "user"

  // Not logged in → redirect to login page
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is provided, ensure the user's role matches one of them
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Optionally you could redirect to a "Not Authorized" page
    return <Navigate to="/" replace />;
  }

  // Authorized – render the child element(s)
  return children;
};

export default PrivateRoute;
