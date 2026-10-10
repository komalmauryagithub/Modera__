import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import '../../styles/common.css';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="alert-banner error" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
