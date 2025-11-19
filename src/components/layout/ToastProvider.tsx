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

