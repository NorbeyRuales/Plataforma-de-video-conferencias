import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
const ToastContext = createContext(undefined);
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
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message, kind = 'info') => {
        const id = toastIdCounter++;
        const toast = { id, message, kind };
        setToasts((current) => [...current, toast]);
        // Auto-dismiss after 3 seconds.
        setTimeout(() => {
            setToasts((current) => current.filter((item) => item.id !== id));
        }, 3000);
    }, []);
    const value = useMemo(() => ({ showToast }), [showToast]);
    const dismissToast = useCallback((id) => {
        setToasts((current) => current.filter((item) => item.id !== id));
    }, []);
    return (_jsxs(ToastContext.Provider, { value: value, children: [children, _jsx("div", { className: "toast-viewport", "aria-live": "polite", "aria-atomic": "true", children: toasts.map((toast) => (
                // Wrapper uses a modifier class per toast kind (error / success / info)
                _jsxs("div", { className: `toast toast-${toast.kind}`, role: "status", children: [_jsx("div", { className: "toast-strip", "aria-hidden": "true" }), _jsxs("div", { className: "toast-body", children: [_jsxs("div", { className: "toast-header-row", children: [_jsx("div", { className: "toast-icon", "aria-hidden": "true", children: _jsx("span", { children: toast.kind === 'error'
                                                    ? '!'
                                                    : toast.kind === 'success'
                                                        ? '✓'
                                                        : 'i' }) }), _jsx("span", { className: "toast-title", children: toast.kind === 'error'
                                                ? 'Error'
                                                : toast.kind === 'success'
                                                    ? 'Acción completada'
                                                    : 'Información' }), _jsx("button", { type: "button", className: "toast-close", "aria-label": "Cerrar notificaci\u00F3n", onClick: () => dismissToast(toast.id), children: "\u00D7" })] }), _jsx("p", { className: "toast-message", children: toast.message })] })] }, toast.id))) })] }));
}
/**
 * Hook that exposes the `showToast` helper from the nearest {@link ToastProvider}.
 *
 * @throws {Error} If used outside of a `<ToastProvider>` tree.
 * @returns {ToastContextValue} Object with helpers to trigger toasts.
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
}
