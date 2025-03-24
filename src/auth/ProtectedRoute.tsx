import React from 'react';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { Navigate } from "react-router-dom";
import { Card, Button, Space } from "antd";
import { loginRequest } from "./config";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Card title="RapidRecruit Authentication" style={{ width: 300 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" onClick={handleLogin} block>
              Sign in with Microsoft
            </Button>
            <Button onClick={handleLogin} block>
              Sign up
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}; 