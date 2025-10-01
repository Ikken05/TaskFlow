import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logReactError } from '../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const timestamp = new Date().toISOString();
    const componentName = this.props.componentName || 'Unknown Component';

    // Log the error with our error logger
    const errorId = logReactError(error, errorInfo, componentName);

    this.setState({ errorId });

    // Additional console logging for development
    console.group(`🚨 REACT ERROR BOUNDARY - ${timestamp}`);
    console.error('Component:', componentName);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error ID:', errorId);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#d63031', marginTop: 0 }}>
            🚨 Something went wrong
          </h2>
          <p style={{ color: '#636e72' }}>
            We're sorry, but something unexpected happened. The error has been logged
            and our team will investigate.
          </p>
          {this.state.errorId && (
            <p style={{
              fontSize: '12px',
              color: '#636e72',
              fontFamily: 'monospace',
              backgroundColor: '#f1f2f6',
              padding: '8px',
              borderRadius: '4px'
            }}>
              Error ID: {this.state.errorId}
            </p>
          )}
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#0984e3',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined, errorId: undefined })}
              style={{
                backgroundColor: '#636e72',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', color: '#636e72' }}>
                Technical Details (Development)
              </summary>
              <pre style={{
                backgroundColor: '#2d3436',
                color: '#ddd',
                padding: '12px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                marginTop: '8px'
              }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;