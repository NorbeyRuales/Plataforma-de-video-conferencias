/**
 * Helpers to persist and broadcast authentication token changes.
 */
const STORAGE_KEY = "videomeet_id_token";

/**
 * Custom event name fired when the auth token changes in this tab.
 */
export const AUTH_TOKEN_EVENT = "videomeet-auth-changed";

/**
 * Reads the persisted auth token from localStorage.
 *
 * @returns {string | null} The bearer token or null when it is not set or window is unavailable.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

/**
 * Persists or clears the auth token in localStorage and notifies listeners.
 *
 * @param {string | null} token Bearer token to store. Pass null/empty to remove it.
 */
export const setAuthToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token && token.trim()) {
    localStorage.setItem(STORAGE_KEY, token.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Notify the app (same tab) that the token changed.
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
};
