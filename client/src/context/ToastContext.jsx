import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(undefined);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    // Check if identical toast already exists
    setToasts((prev) => {
      const duplicate = prev.find(t => t.message === message && t.type === type);
      if (duplicate) {
        return prev; // Don't add duplicate
      }
      
      const id = Date.now() + Math.random(); // Better unique ID
      const newToast = { id, message, type };
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 3000);
      
      // Limit to max 3 toasts at a time
      const updated = [...prev, newToast];
      return updated.length > 3 ? updated.slice(-3) : updated;
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="toast__icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast__message">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
