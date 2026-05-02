import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, errorInfo);
    
    // Log detailed error information
    console.group('🚨 Application Error Details');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();

    // Store error in localStorage for debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('sf_error_logs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      localStorage.setItem('sf_error_logs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to log error to localStorage:', e);
    }

    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'grid', 
          placeItems: 'center', 
          padding: '1rem',
          backgroundColor: '#0a0a0a',
          color: '#ffffff'
        }}>
          <div style={{ 
            textAlign: 'center', 
            maxWidth: 480,
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid #333',
            backgroundColor: '#111'
          }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ef4444' }}>
              🚨 Application Error
            </h1>
            <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
              Something went wrong. The error has been logged for debugging.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ 
                textAlign: 'left', 
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#000',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.message}
                  {this.state.error.stack && `\n\nStack:\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={this.handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
