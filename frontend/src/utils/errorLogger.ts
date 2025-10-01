// Frontend Error Logger Utility
export interface ErrorDetails {
  timestamp: string;
  errorId: string;
  message: string;
  stack?: string;
  component?: string;
  action?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  additionalData?: any;
}

class ErrorLogger {
  private errors: ErrorDetails[] = [];
  private maxErrors = 100; // Keep only last 100 errors in memory

  // Generate unique error ID
  private generateErrorId(): string {
    return Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }

  // Log error with detailed information
  log(error: Error | string, context?: {
    component?: string;
    action?: string;
    additionalData?: any;
  }): string {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();

    const errorDetails: ErrorDetails = {
      timestamp,
      errorId,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      component: context?.component,
      action: context?.action,
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData: context?.additionalData
    };

    // Add to memory store
    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest error
    }

    // Console logging with styled output
    console.group(`🔥 ERROR [ID: ${errorId}] - ${timestamp}`);
    console.error('Message:', errorDetails.message);
    if (errorDetails.component) console.error('Component:', errorDetails.component);
    if (errorDetails.action) console.error('Action:', errorDetails.action);
    console.error('URL:', errorDetails.url);
    console.error('User Agent:', errorDetails.userAgent);
    if (errorDetails.stack) console.error('Stack:', errorDetails.stack);
    if (errorDetails.additionalData) {
      console.error('Additional Data:', errorDetails.additionalData);
    }
    console.groupEnd();

    // In a production app, you might want to send this to a logging service
    // this.sendToLoggingService(errorDetails);

    return errorId;
  }

  // Log API errors specifically
  logApiError(error: any, context: {
    endpoint: string;
    method: string;
    component?: string;
    requestData?: any;
  }): string {
    const timestamp = new Date().toISOString();
    const errorId = this.generateErrorId();

    const errorDetails = {
      timestamp,
      errorId,
      message: error.message || 'API Error',
      component: context.component,
      action: `API ${context.method.toUpperCase()} ${context.endpoint}`,
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData: {
        endpoint: context.endpoint,
        method: context.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestData: context.requestData,
        errorCode: error.code
      }
    };

    this.errors.push(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Enhanced API error console logging
    console.group(`🌐 API ERROR [ID: ${errorId}] - ${timestamp}`);
    console.error(`${context.method.toUpperCase()} ${context.endpoint}`);
    console.error('Status:', error.response?.status, error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    if (context.requestData) {
      const logData = { ...context.requestData };
      if (logData.password) logData.password = '[REDACTED]';
      if (logData.newPassword) logData.newPassword = '[REDACTED]';
      console.error('Request Data:', logData);
    }
    if (context.component) console.error('Component:', context.component);
    console.error('URL:', window.location.href);
    if (error.code) console.error('Error Code:', error.code);
    console.groupEnd();

    return errorId;
  }

  // Log user action for debugging context
  logUserAction(action: string, component?: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 👤 USER ACTION: ${action}${component ? ` (${component})` : ''}`);
    if (data) {
      const logData = { ...data };
      if (logData.password) logData.password = '[REDACTED]';
      if (logData.newPassword) logData.newPassword = '[REDACTED]';
      console.log(`[${timestamp}] Data:`, logData);
    }
  }

  // Log navigation events
  logNavigation(from: string, to: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧭 NAVIGATION: ${from} → ${to}`);
  }

  // Get recent errors (useful for debugging)
  getRecentErrors(limit: number = 10): ErrorDetails[] {
    return this.errors.slice(-limit);
  }

  // Clear error history
  clearErrors(): void {
    this.errors = [];
    console.log(`[${new Date().toISOString()}] 🧹 Error history cleared`);
  }

  // Export errors as JSON (useful for sending to support)
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  // In production, you might want to send errors to a logging service
  private async sendToLoggingService(errorDetails: ErrorDetails): Promise<void> {
    // Example: Send to your logging service
    // try {
    //   await fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorDetails)
    //   });
    // } catch (err) {
    //   console.warn('Failed to send error to logging service:', err);
    // }
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  errorLogger.log(event.error || event.message, {
    component: 'Global',
    action: 'Unhandled Error',
    additionalData: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.log(event.reason || 'Unhandled Promise Rejection', {
    component: 'Global',
    action: 'Unhandled Promise Rejection'
  });
});

// Helper function for React error boundaries
export const logReactError = (error: Error, errorInfo: any, component: string): string => {
  return errorLogger.log(error, {
    component,
    action: 'React Error Boundary',
    additionalData: {
      componentStack: errorInfo.componentStack
    }
  });
};

// Helper function for try-catch blocks
export const logError = (error: Error | string, component?: string, action?: string, additionalData?: any): string => {
  return errorLogger.log(error, {
    component,
    action,
    additionalData
  });
};

export default errorLogger;