const STORAGE_KEY = "videomeet_id_token";
export const AUTH_TOKEN_EVENT = "videomeet-auth-changed";

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

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
