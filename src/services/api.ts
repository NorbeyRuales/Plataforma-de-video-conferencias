/**
 * Lightweight REST client for the VideoMeet backend.
 * All helpers below are thin wrappers over `fetch` that attach the base URL and token.
 */
import { getAuthToken } from "./authToken";

/**
 * Base URL for backend REST calls, selecting the environment-specific value.
 */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? import.meta.env.VITE_API_BASE_URL_LOCAL || "http://localhost:8080/api/v1"
    : import.meta.env.VITE_API_BASE_URL_PROD ||
      "https://backend-meet-lloz.onrender.com/api/v1");

/**
 * HTTP verbs supported by the API helper.
 */
type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Options accepted by the API wrapper.
 */
interface ApiOptions<TBody = unknown> {
  /** HTTP method to use. Defaults to GET. */
  method?: ApiMethod;
  /** Optional JSON body to serialize. */
  body?: TBody;
  /** Manual token override; otherwise localStorage token is used. */
  tokenOverride?: string;
}

/**
 * Thin wrapper around `fetch` that applies the base URL, JSON headers and auth token.
 *
 * @template TResponse Expected JSON response shape.
 * @template TBody JSON-serializable payload type.
 * @param {string} path API path (e.g. `/users/login`).
 * @param {ApiOptions<TBody>} [options] HTTP options.
 * @throws {Error} When the response is not ok; includes backend message when available.
 * @returns {Promise<TResponse>} Parsed JSON payload (or undefined for 204/no JSON).
 */
async function apiFetch<TResponse, TBody = unknown>(
  path: string,
  options: ApiOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", body, tokenOverride } = options;

  const headers: Record<string, string> = {
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

  const isJson =
    response.headers.get("content-type")?.includes("application/json") ?? false;

  if (!response.ok) {
    const errorPayload = isJson ? await response.json().catch(() => null) : null;
    const message =
      errorPayload?.message ||
      errorPayload?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204 || !isJson) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

// ===== Users =====

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  lastname: string;
  birthdate: string;
}

/**
 * Creates a new user account.
 *
 * @param {RegisterPayload} payload Registration fields.
 * @returns {Promise<{ message: string } & Record<string, unknown>>} Backend confirmation payload.
 */
export const registerUser = (payload: RegisterPayload) =>
  apiFetch<{ message: string } & Record<string, unknown>>(
    "/users/register",
    {
      method: "POST",
      body: payload,
    }
  );

/**
 * Triggers a password reset email for the given address.
 *
 * @param {string} email Account email to reset.
 * @returns {Promise<{ message: string; resetLink?: string }>} Backend response with optional reset link (dev).
 */
export const requestPasswordReset = (email: string) =>
  apiFetch<{ message: string; resetLink?: string }>("/users/request-password-reset", {
    method: "POST",
    body: { email },
  });

export interface LoginResponse {
  message: string;
  idToken: string;
  refreshToken?: string;
  user?: UserProfile;
}

/**
 * Exchanges credentials for a Firebase/REST id token.
 *
 * @param {string} email User email.
 * @param {string} password User password.
 * @returns {Promise<LoginResponse>} Token payload including optional profile.
 */
export const loginWithEmailPassword = (email: string, password: string) =>
  apiFetch<LoginResponse>("/users/login", {
    method: "POST",
    body: { email, password },
  });

export interface UserProfile {
  id: string;
  username: string;
  lastname: string;
  birthdate: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Retrieves the authenticated user's profile.
 */
export const getProfile = () => apiFetch<UserProfile>("/users/profile");

/**
 * Updates profile fields for the current user.
 *
 * @param {Partial<UserProfile>} data Fields to update.
 */
export const updateProfile = (data: Partial<UserProfile>) =>
  apiFetch<{ message: string }>("/users/profile", {
    method: "PUT",
    body: data,
  });

/**
 * Updates the email for the current user.
 *
 * @param {string} email New email address.
 */
export const updateEmail = (email: string) =>
  apiFetch<{ message: string }>("/users/email", {
    method: "PUT",
    body: { email },
  });

/**
 * Reauthenticates the user with Firebase and updates their password.
 *
 * @param {string} email Email used for reauthentication.
 * @param {string} currentPassword Current password for verification.
 * @param {string} newPassword New password to set.
 * @returns {Promise<{ message: string }>} Confirmation message.
 */
export const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string
) => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Falta VITE_FIREBASE_API_KEY para cambiar contrase�a");
  }

  // Re-authentication: obtain a fresh idToken
  const loginResp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: currentPassword,
        returnSecureToken: true,
      }),
    }
  );
  const loginData = await loginResp.json().catch(() => null);
  if (!loginResp.ok || !loginData?.idToken) {
    const msg =
      loginData?.error?.message === "INVALID_PASSWORD"
        ? "Contraseña actual incorrecta"
        : loginData?.error?.message || "No se pudo reautenticar";
    throw new Error(msg);
  }

  // Password update call
  const updateResp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken: loginData.idToken,
        password: newPassword,
        returnSecureToken: true,
      }),
    }
  );
  const updateData = await updateResp.json().catch(() => null);
  if (!updateResp.ok) {
    const msg =
      updateData?.error?.message || "No se pudo cambiar la contraseña";
    throw new Error(msg);
  }
  return { message: "Contraseña actualizada" };
};

/**
 * Deletes the authenticated user's profile.
 */
export const deleteProfile = () =>
  apiFetch<{ message: string }>("/users/profile", { method: "DELETE" });

// ===== Meetings =====

export interface Meeting {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingPayload {
  title: string;
  date: string;
  time: string;
  duration: number;
  description?: string;
}

/**
 * Creates a meeting owned by the current user.
 *
 * @param {CreateMeetingPayload} payload Meeting details.
 */
export const createMeeting = (payload: CreateMeetingPayload) =>
  apiFetch<{ message: string; meeting: Meeting }>("/meetings", {
    method: "POST",
    body: payload,
  });

/**
 * Lists meetings owned by the authenticated user.
 */
export const listMeetings = () => apiFetch<Meeting[]>("/meetings");

/**
 * Retrieves a meeting by id.
 *
 * @param {string} id Meeting identifier.
 */
export const getMeeting = (id: string) =>
  apiFetch<Meeting>(`/meetings/${id}`);

/**
 * Updates a meeting by id.
 *
 * @param {string} id Meeting identifier.
 * @param {Partial<Meeting>} data Fields to update.
 */
export const updateMeeting = (id: string, data: Partial<Meeting>) =>
  apiFetch<{ message: string }>(`/meetings/${id}`, {
    method: "PUT",
    body: data,
  });

/**
 * Deletes a meeting by id.
 *
 * @param {string} id Meeting identifier.
 */
export const deleteMeetingApi = (id: string) =>
  apiFetch<{ message: string }>(`/meetings/${id}`, { method: "DELETE" });

export { API_BASE };
