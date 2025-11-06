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
