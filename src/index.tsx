import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './auth/AuthProvider.tsx';
import './index.css';
import App from './App.tsx';
import reportWebVitals from './reportWebVitals.ts';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ConfigProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </React.StrictMode>
);

reportWebVitals();