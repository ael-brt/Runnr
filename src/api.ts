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
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j?.error || "register_failed");
    } catch {
      throw new Error("register_failed");
    }
  }
  return res.json();
}

export async function loginEmail(data: { email: string; password: string }) {
  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j?.error || "login_failed");
    } catch {
      throw new Error("login_failed");
    }
  }
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
  distances?: string;
  speed_kmh?: number | null;
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
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("profile_update_failed");
  return res.json();
}

export type PublicProfile = {
  id: number;
  name: string;
  level: string;
  location_city: string;
  goals: string;
  distances: string;
  speed_kmh: number | null;
};

export async function getPublicProfile(userId: number | string): Promise<PublicProfile> {
  // ATTENTION: L'URL ici semble différer de celle que nous avons définie.
  // Je garde la vôtre, mais l'URL du backend est peut-être "/api/u/<int:user_id>"
  const res = await fetch(`${BASE}/api/users/${userId}/profile`, { credentials: "include" });
  if (!res.ok) throw new Error("public_profile_fetch_failed");
  return res.json();
}


// --- 1. AJOUTER CETTE CLASSE D'ERREUR ---
/**
 * Erreur personnalisée pour identifier une erreur 429 (limite de 'likes' atteinte).
 */
export class LikeLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LikeLimitError";
  }
}


// --- 2. AJOUTER CETTE FONCTION ---
/**
 * Appelle l'API pour "liker" un utilisateur (US #11).
 * C'est l'endpoint que nous avons créé : POST /api/swipe/like/<id>
 */
export async function likeUser(targetId: number): Promise<{ ok: boolean, is_match: boolean }> {
  const res = await fetch(`${BASE}/api/swipe/like/${targetId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // Envoyer un corps vide, comme requis par la vue
  });

  // Gestion des erreurs
  if (!res.ok) {
    // Cas spécifique : Limite atteinte
    if (res.status === 429) {
      try {
        const j = await res.json();
        // Lancer notre erreur personnalisée
        throw new LikeLimitError(j?.error || "Limite de likes atteinte");
      } catch (e) {
        throw new LikeLimitError("Limite de likes atteinte");
      }
    }
    
    // Autres erreurs (404, 500...)
    try {
      const j = await res.json();
      throw new Error(j?.error || "like_failed");
    } catch {
      throw new Error("like_failed");
    }
  }

  // Succès
  return res.json();
}