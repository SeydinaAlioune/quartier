import React, { useEffect, useRef } from 'react';

const getFocusable = (root) => {
  if (!root) return [];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  const nodes = Array.from(root.querySelectorAll(selectors.join(',')));
  return nodes.filter((el) => {
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  });
};

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
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!open || !closeOnEscape) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      const card = cardRef.current;
      const focusable = getFocusable(card);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else if (card) {
        card.focus();
      }
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      const el = restoreFocusRef.current;
      if (el && typeof el.focus === 'function') {
        try {
          el.focus();
        } catch {
        }
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const card = cardRef.current;
      const focusable = getFocusable(card);
      if (focusable.length === 0) {
        e.preventDefault();
        card?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === card) {
          e.preventDefault();
          last.focus();
        }
        return;
      }
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onMouseDown={() => {
        if (closeOnOverlay) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        className={cardClassName}
        onMouseDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
