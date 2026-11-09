import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import './index.css';

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RootErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8EEDB',
            color: '#30251E',
            padding: 24,
            textAlign: 'center',
            fontFamily: 'DM Sans, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 460,
              width: '100%',
              backgroundColor: '#FFF9EF',
              border: '1px solid #E4D7BF',
              borderRadius: 22,
              padding: 32,
              boxShadow: '0 20px 48px rgba(23,61,50,0.12)',
            }}
          >
            <img
              src="/logo.png"
              alt="Namaste Siam"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                margin: '0 auto 16px',
                border: '2px solid #D9B66D',
              }}
            />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#173D32', margin: '0 0 8px' }}>
              Namaste Siam Indian Kitchen
            </h1>
            <p style={{ color: '#75685A', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
              The application encountered a temporary display refresh. Please reload to continue.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#173D32',
                  color: '#FFF9EF',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '11px 24px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = '/')}
                style={{
                  backgroundColor: 'transparent',
                  color: '#173D32',
                  border: '1px solid #173D32',
                  borderRadius: 9999,
                  padding: '11px 22px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <AdminAuthProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AdminAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);

