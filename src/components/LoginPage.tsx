import React from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from '../auth/config.ts';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      console.log('Starting login...');
      const response = await instance.loginPopup(loginRequest);
      console.log('Login successful:', response);
    } catch (error) {
      console.error('Login failed:', error);
      message.error('Login failed. Please try again.');
    }
  };

  const handleSignUp = async () => {
    try {
      console.log('Starting signup...');
      const response = await instance.loginPopup({
        ...loginRequest,
        prompt: 'create'
      });
      console.log('Signup successful:', response);
    } catch (error) {
      console.error('Signup failed:', error);
      message.error('Account creation failed. Please try again.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f0f2f5'
    }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <Title level={2}>🚀 RapidRecruit</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Your AI-Powered Resume Management System
        </Text>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="primary" size="large" onClick={handleLogin} block>
            Sign In
          </Button>
          <Button size="large" onClick={handleSignUp} block>
            Create Account
          </Button>
        </Space>
      </Card>
    </div>
  );
}; 
