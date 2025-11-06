const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function getMe() {
  const res = await fetch(`${BASE}/api/me`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("unauthenticated");
  return res.json();
}

export async function logoutApi() {
  await fetch(`${BASE}/api/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function registerEmail(data: { email: string; password: string; name?: string }) {
  const res = await fetch(`${BASE}/api/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("register_failed");
  return res.json();
}

export async function loginEmail(data: { email: string; password: string }) {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("login_failed");
  return res.json();
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${BASE}/api/request-password-reset`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("reset_request_failed");
  return res.json();
}

export async function resetPasswordConfirm(params: { uid: string; token: string; password: string }) {
  const res = await fetch(`${BASE}/api/reset-password-confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("reset_confirm_failed");
  return res.json();
}

export type Profile = {
  level: string;
  location_city: string;
  goals: string;
  availability_week: boolean;
  availability_weekend: boolean;
  completion?: number;
  missing?: string[];
};

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${BASE}/api/profile`, { credentials: "include" });
  if (!res.ok) throw new Error("profile_fetch_failed");
  return res.json();
}

export async function updateProfile(patch: Partial<Profile>) {
  const res = await fetch(`${BASE}/api/profile/update`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("profile_update_failed");
  return res.json();
}
