export const emitToast = (message) => {
  if (typeof window === 'undefined') return;
  const msg = typeof message === 'string' ? message : String(message || '');
  if (!msg) return;
  try {
    window.dispatchEvent(new CustomEvent('qc_toast', { detail: { message: msg } }));
  } catch (e) {
    // ignore
  }
};
