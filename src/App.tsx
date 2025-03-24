import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Button, Tabs, Input, Spin, message } from 'antd';
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { AuthProvider } from './auth/AuthProvider.tsx';
import { ProtectedRoute } from './auth/ProtectedRoute.tsx';
import UploadResume from './components/UploadResume.tsx';
import ViewResumes from './components/ViewResumes.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import './App.css';
import { MainContent } from './components/MainContent.tsx';

const { Header, Content, Sider } = Layout;
const { Password } = Input;

const App: React.FC = () => {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  console.log('Authentication status:', isAuthenticated);

  return (
    <>
      {isAuthenticated ? <MainContent /> : <LoginPage />}
    </>
  );
};

export default App; 