<<<<<<< HEAD
/**
 * Very small placeholder toast helper for Sprint 1.
 * It exposes the `useToast` hook used by the auth and meeting pages,
 * but for now it only logs messages to the console.
 *
 * When real toasts are implemented, this file can be replaced with
 * a Context + visual toast stack.
 */
export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastApi {
  showToast: (message: string, variant?: ToastVariant) => void;
}

export function useToast(): ToastApi {
  const showToast = (message: string, variant: ToastVariant = 'info'): void => {
    // Placeholder behaviour: log to the browser console.
    // This avoids runtime errors while keeping the API stable.
    // eslint-disable-next-line no-console
    console.log(`[toast:${variant}] ${message}`);
  };

  return { showToast };
}

=======
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode
} from 'react';

/**
 * Allowed toast variants.
 * - `info`: neutral information to the user.
 * - `success`: positive feedback when an action completes.
 * - `error`: something went wrong or is not available yet.
 */
export type ToastKind = 'info' | 'success' | 'error';

/**
 * Toast object stored in internal state.
 */
export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

/**
 * Public API exposed through the Toast context.
 */
interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastIdCounter = 1;

/**
 * Global provider that keeps a list of toasts in memory and renders them
 * in the top‑right corner of the viewport.
 *
 * Wrap this around the application tree to enable the `useToast` hook.
 *
 * @param {{ children: ReactNode }} props React children to wrap.
 * @returns {JSX.Element} Provider with the toast viewport.
 */
export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = toastIdCounter++;
    const toast: Toast = { id, message, kind };

    setToasts((current) => [...current, toast]);

    // Auto-dismiss after 3 seconds.
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3000);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast viewport */}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          // Wrapper uses a modifier class per toast kind (error / success / info)
          <div
            key={toast.id}
            className={`toast toast-${toast.kind}`}
            role="status"
          >
            <div className="toast-strip" aria-hidden="true" />

            <div className="toast-body">
              <div className="toast-header-row">
              <div className="toast-icon" aria-hidden="true">
                  <span>
                    {toast.kind === 'error'
                      ? '!'
                      : toast.kind === 'success'
                      ? '✓'
                      : 'i'}
                  </span>
              </div>
                <span className="toast-title">
                  {toast.kind === 'error'
                    ? 'Error'
                    : toast.kind === 'success'
                    ? 'Acción completada'
                    : 'Información'}
                </span>
                <button
                  type="button"
                  className="toast-close"
                  aria-label="Cerrar notificación"
                  onClick={() => dismissToast(toast.id)}
                >
                  ×
                </button>
              </div>
              <p className="toast-message">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook that exposes the `showToast` helper from the nearest {@link ToastProvider}.
 *
 * @throws {Error} If used outside of a `<ToastProvider>` tree.
 * @returns {ToastContextValue} Object with helpers to trigger toasts.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
>>>>>>> main
