import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

const RequireAuth = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem("access_token");
  const user = getCurrentUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    // If user doesn't have the required role, redirect to home or unauthorized
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
