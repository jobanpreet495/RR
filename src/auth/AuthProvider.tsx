import React, { useEffect, useState } from 'react';
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "./config.ts";
import { Spin, message } from 'antd';

const msalInstance = new PublicClientApplication(msalConfig);

// Add event callbacks
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_FAILURE) {
    console.error('Login failed:', event.error);
    message.error(`Login failed: ${event.error?.message}`);
  }
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    console.log('Login successful:', event);
  }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        console.log('MSAL initialized successfully');
        setIsInitialized(true);
      } catch (err) {
        console.error('MSAL initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
        message.error('Authentication initialization failed');
      }
    };

    initializeMsal();
  }, []);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Authentication Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Initializing authentication..." />
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}; 