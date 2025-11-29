import { getAuthToken } from "./authToken";
/**
 * Base URL for backend requests. Falls back to sensible defaults per environment.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
        ? import.meta.env.VITE_API_BASE_URL_LOCAL || "http://localhost:8080/api/v1"
        : import.meta.env.VITE_API_BASE_URL_PROD ||
            "https://backend-meet-lloz.onrender.com/api/v1");
/**
 * Perform a JSON HTTP request against the backend.
 *
 * - Automatically appends the bearer token from localStorage (or override).
 * - Serializes the body as JSON and parses JSON responses when present.
 * - Throws an Error with a normalized message when the response is not ok.
 *
 * @template TResponse Expected JSON response shape.
 * @template TBody Outgoing request body shape.
 * @param {string} path API path starting with `/`.
 * @param {ApiOptions<TBody>} [options] HTTP method, body, or token override.
 * @returns {Promise<TResponse>} Parsed JSON response or `undefined` for 204/no-json.
 * @throws {Error} When the response is not ok or JSON parsing fails.
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
 * Create a new user account.
 *
 * @param {RegisterPayload} payload User profile and credentials.
 * @returns {Promise<{ message: string } & Record<string, unknown>>} Success message plus any extra backend fields.
 */
export const registerUser = (payload) => apiFetch("/users/register", {
    method: "POST",
    body: payload,
});
/**
 * Trigger a password reset email flow.
 *
 * @param {string} email User email to send the reset link to.
 * @returns {Promise<{ message: string; resetLink?: string }>} Backend message, optionally including the reset link in non-production envs.
 */
export const requestPasswordReset = (email) => apiFetch("/users/request-password-reset", {
    method: "POST",
    body: { email },
});
/**
 * Authenticate a user with email and password.
 *
 * @param {string} email Email address.
 * @param {string} password Plain text password.
 * @returns {Promise<LoginResponse>} Backend response with tokens and optional user profile.
 */
export const loginWithEmailPassword = (email, password) => apiFetch("/users/login", {
    method: "POST",
    body: { email, password },
});
/**
 * Fetch the authenticated user's profile.
 *
 * @returns {Promise<UserProfile>} Profile attributes from the backend.
 */
export const getProfile = () => apiFetch("/users/profile");
/**
 * Update profile attributes for the current user.
 *
 * @param {Partial<UserProfile>} data Fields to update.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const updateProfile = (data) => apiFetch("/users/profile", {
    method: "PUT",
    body: data,
});
/**
 * Change the email of the authenticated user.
 *
 * @param {string} email New email address.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const updateEmail = (email) => apiFetch("/users/email", {
    method: "PUT",
    body: { email },
});
/**
 * Re-authenticate the user via Firebase REST API and update their password.
 *
 * Note: Uses direct Firebase endpoints because the backend does not yet expose this flow.
 *
 * @param {string} email Current email used for sign-in.
 * @param {string} currentPassword Current password (for re-authentication).
 * @param {string} newPassword New password to set.
 * @returns {Promise<{ message: string }>} Confirmation message when successful.
 */
export const changePassword = async (email, currentPassword, newPassword) => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
        throw new Error("Falta VITE_FIREBASE_API_KEY para cambiar contraseña");
    }
    // Reautenticación: obtener idToken
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
    // Actualización de contraseña
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
 * Delete the authenticated user's account.
 *
 * @returns {Promise<{ message: string }>} Confirmation message from the backend.
 */
export const deleteProfile = () => apiFetch("/users/profile", { method: "DELETE" });
/**
 * Create a new meeting for the authenticated user.
 *
 * @param {CreateMeetingPayload} payload Meeting metadata to persist.
 * @returns {Promise<{ message: string; meeting: Meeting }>} Confirmation plus created meeting.
 */
export const createMeeting = (payload) => apiFetch("/meetings", {
    method: "POST",
    body: payload,
});
/**
 * List meetings owned by the authenticated user.
 *
 * @returns {Promise<Meeting[]>} Collection of meetings.
 */
export const listMeetings = () => apiFetch("/meetings");
/**
 * Get a single meeting by ID.
 *
 * @param {string} id Meeting identifier.
 * @returns {Promise<Meeting>} Meeting details.
 */
export const getMeeting = (id) => apiFetch(`/meetings/${id}`);
/**
 * Update meeting metadata.
 *
 * @param {string} id Meeting identifier.
 * @param {Partial<Meeting>} data Fields to patch.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const updateMeeting = (id, data) => apiFetch(`/meetings/${id}`, {
    method: "PUT",
    body: data,
});
/**
 * Delete a meeting by ID.
 *
 * @param {string} id Meeting identifier.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const deleteMeetingApi = (id) => apiFetch(`/meetings/${id}`, { method: "DELETE" });
export { API_BASE };
