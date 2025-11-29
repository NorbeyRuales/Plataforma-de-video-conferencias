/**
 * Small helper to persist the auth token in `localStorage`
 * and notify same-tab listeners when it changes.
 */
const STORAGE_KEY = "videomeet_id_token";
/**
 * Custom event name fired whenever {@link setAuthToken} updates the token.
 */
export const AUTH_TOKEN_EVENT = "videomeet-auth-changed";
/**
 * Retrieve the persisted auth token (if any).
 *
 * Safe to call in server-side contexts; returns `null` when `window` is not available.
 *
 * @returns {string | null} The stored token or `null` when missing.
 */
export const getAuthToken = () => {
    if (typeof window === "undefined")
        return null;
    return localStorage.getItem(STORAGE_KEY);
};
/**
 * Persist or clear the auth token and notify listeners in the same tab.
 *
 * @param {string | null} token Token to store; falsy values clear the slot.
 * @returns {void}
 */
export const setAuthToken = (token) => {
    if (typeof window === "undefined")
        return;
    if (token && token.trim()) {
        localStorage.setItem(STORAGE_KEY, token.trim());
    }
    else {
        localStorage.removeItem(STORAGE_KEY);
    }
    // Notify the app (same tab) that the token changed.
    window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
};
