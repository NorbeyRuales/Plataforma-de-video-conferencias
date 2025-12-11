const STORAGE_KEY = "videomeet_id_token";
export const AUTH_TOKEN_EVENT = "videomeet-auth-changed";

/**
 * Read the stored auth token from localStorage.
 *
 * @returns {string | null} Current token or null when missing/SSR.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

/**
 * Persist or clear the auth token and notify listeners.
 *
 * @param {string | null} token Token to store; pass null/empty to remove it.
 */
export const setAuthToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token && token.trim()) {
    localStorage.setItem(STORAGE_KEY, token.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Notify the current tab/app that the auth token changed.
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
};
