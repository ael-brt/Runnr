export async function getMe() {
  const res = await fetch("http://localhost:8000/api/me", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("unauthenticated");
  return res.json();
}

export async function logoutApi() {
  await fetch("http://localhost:8000/api/logout", {
    method: "POST",
    credentials: "include",
  });
}
