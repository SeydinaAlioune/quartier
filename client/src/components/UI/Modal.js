import React, { useEffect } from 'react';

const Modal = ({
  open,
  onClose,
  children,
  overlayClassName = 'ui-modal-overlay',
  cardClassName = 'ui-modal-card',
  closeOnOverlay = true,
  closeOnEscape = true,
  ariaLabel,
}) => {
  useEffect(() => {
    if (!open || !closeOnEscape) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  return (
    <div
      className={overlayClassName}
      role="dialog"
      aria-label={ariaLabel}
      onMouseDown={() => {
        if (closeOnOverlay) onClose?.();
      }}
    >
      <div
        className={cardClassName}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
