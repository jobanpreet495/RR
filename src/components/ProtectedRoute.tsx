import React from 'react';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Navigate } from "react-router-dom";
import { loginRequest } from "../auth/config";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  if (!isAuthenticated) {
    instance.loginRedirect(loginRequest);
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;