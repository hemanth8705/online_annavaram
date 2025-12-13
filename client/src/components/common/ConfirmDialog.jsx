import React from 'react';
import Modal from './Modal';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message,
  details,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  confirmButtonStyle = "danger",
  isProcessing = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <p style={{ 
            color: '#374151', 
            lineHeight: '1.6',
            marginBottom: details ? '1rem' : 0
          }}>
            {message}
          </p>
          {details && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              {details}
            </div>
          )}
          <p style={{ 
            color: '#dc2626', 
            fontSize: '0.875rem',
            fontWeight: '600',
            marginTop: '1rem'
          }}>
            ⚠️ This action cannot be undone.
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'flex-end' 
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="btn btn-secondary"
            style={{
              minWidth: '100px'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="btn btn-primary"
            style={{
              minWidth: '100px',
              backgroundColor: confirmButtonStyle === 'danger' ? '#dc2626' : undefined,
              borderColor: confirmButtonStyle === 'danger' ? '#dc2626' : undefined
            }}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
