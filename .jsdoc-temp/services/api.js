import { getAuthToken } from "./authToken";
const API_BASE = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
        ? import.meta.env.VITE_API_BASE_URL_LOCAL || "http://localhost:8080/api/v1"
        : import.meta.env.VITE_API_BASE_URL_PROD ||
            "https://backend-meet-lloz.onrender.com/api/v1");
/**
 * Small wrapper around fetch with JSON handling and auth token header.
 *
 * @param {string} path API path after the base URL.
 * @param {ApiOptions<TBody>} [options] HTTP method, body and token override.
 * @returns {Promise<TResponse>} Parsed JSON response or void for 204 responses.
 * @throws {Error} When the request fails or returns a non-2xx status.
 */
async function apiFetch(path, options = {}) {
    const { method = "GET", body, tokenOverride } = options;
    const headers = {
        "Content-Type": "application/json",
    };
    const token = tokenOverride ?? getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
    if (!response.ok) {
        const errorPayload = isJson ? await response.json().catch(() => null) : null;
        const message = errorPayload?.message ||
            errorPayload?.error ||
            `Request failed with status ${response.status}`;
        throw new Error(message);
    }
    if (response.status === 204 || !isJson) {
        return undefined;
    }
    return (await response.json());
}
/**
 * Register a new user in the backend.
 *
 * @param {RegisterPayload} payload User registration data.
 * @returns {Promise<Record<string, unknown>>} API response with message and extra fields.
 */
export const registerUser = (payload) => apiFetch("/users/register", {
    method: "POST",
    body: payload,
});
/**
 * Request a password reset link for the given email.
 *
 * @param {string} email Account email.
 * @returns {Promise<Record<string, unknown>>} Response message (and reset link in dev).
 */
export const requestPasswordReset = (email) => apiFetch("/users/request-password-reset", {
    method: "POST",
    body: { email },
});
/**
 * Log in with email/password credentials.
 *
 * @param {string} email User email.
 * @param {string} password Plain password.
 * @returns {Promise<LoginResponse>} Login payload with tokens and profile (when available).
 */
export const loginWithEmailPassword = (email, password) => apiFetch("/users/login", {
    method: "POST",
    body: { email, password },
});
/**
 * Fetch the authenticated user's profile.
 *
 * @returns {Promise<UserProfile>} Profile data.
 */
export const getProfile = () => apiFetch("/users/profile");
/**
 * Update the authenticated user's profile.
 *
 * @param {Partial<UserProfile>} data Fields to update.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const updateProfile = (data) => apiFetch("/users/profile", {
    method: "PUT",
    body: data,
});
/**
 * Update the authenticated user's email address.
 *
 * @param {string} email New email.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const updateEmail = (email) => apiFetch("/users/email", {
    method: "PUT",
    body: { email },
});
/**
 * Change the user's password using Firebase Auth REST endpoints.
 *
 * @param {string} email Account email.
 * @param {string} currentPassword Existing password.
 * @param {string} newPassword New password to set.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const changePassword = async (email, currentPassword, newPassword) => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
        throw new Error("Falta VITE_FIREBASE_API_KEY para cambiar contraseña");
    }
    // Re-authenticate to get a fresh idToken
    const loginResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            password: currentPassword,
            returnSecureToken: true,
        }),
    });
    const loginData = await loginResp.json().catch(() => null);
    if (!loginResp.ok || !loginData?.idToken) {
        const msg = loginData?.error?.message === "INVALID_PASSWORD"
            ? "Contraseña actual incorrecta"
            : loginData?.error?.message || "No se pudo reautenticar";
        throw new Error(msg);
    }
    // Password update using the Firebase endpoint
    const updateResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            idToken: loginData.idToken,
            password: newPassword,
            returnSecureToken: true,
        }),
    });
    const updateData = await updateResp.json().catch(() => null);
    if (!updateResp.ok) {
        const msg = updateData?.error?.message || "No se pudo cambiar la contraseña";
        throw new Error(msg);
    }
    return { message: "Contraseña actualizada" };
};
/**
 * Delete the authenticated user's profile.
 *
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const deleteProfile = () => apiFetch("/users/profile", { method: "DELETE" });
/**
 * Create a meeting owned by the current user.
 *
 * @param {CreateMeetingPayload} payload Meeting data.
 * @returns {Promise<{ message: string, meeting: Meeting }>} Created meeting payload.
 */
export const createMeeting = (payload) => apiFetch("/meetings", {
    method: "POST",
    body: payload,
});
/**
 * Retrieve the list of meetings for the current user.
 *
 * @returns {Promise<Meeting[]>} Array of meetings.
 */
export const listMeetings = () => apiFetch("/meetings");
/**
 * Get details for a single meeting.
 *
 * @param {string} id Meeting identifier.
 * @returns {Promise<Meeting>} Meeting data.
 */
export const getMeeting = (id) => apiFetch(`/meetings/${id}`);
/**
 * Update a meeting.
 *
 * @param {string} id Meeting identifier.
 * @param {Partial<Meeting>} data Fields to update.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const updateMeeting = (id, data) => apiFetch(`/meetings/${id}`, {
    method: "PUT",
    body: data,
});
/**
 * Delete a meeting.
 *
 * @param {string} id Meeting identifier.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const deleteMeetingApi = (id) => apiFetch(`/meetings/${id}`, { method: "DELETE" });
export { API_BASE };
