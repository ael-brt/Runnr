const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// --- Erreurs personnalisées pour le Swipe ---

export class LikeLimitReachedError extends Error {
  constructor(message?: string) {
    super(message || "Limite de likes atteinte");
    this.name = "LikeLimitReachedError";
  }
}

export class TotalActionLimitReachedError extends Error {
  constructor(message?: string) {
    super(message || "Limite d'actions atteinte");
    this.name = "TotalActionLimitReachedError";
  }
}

// --- Fonctions API existantes ---

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
  const res = await fetch(`${BASE}/api/users/${userId}/profile`, { credentials: "include" });
  if (!res.ok) throw new Error("public_profile_fetch_failed");
  return res.json();
}

// --- NOUVELLES FONCTIONS POUR LE SWIPE ---

// Le type de profil que la page de swipe attend
// (basé sur votre mock, mais aligné sur PublicProfile)
export interface SwipeProfile {
  id: number;
  name: string;
  imageUrl: string; // L'API doit fournir ceci
  commune: string; // Vient de 'location_city'
  distanceKm: number; // L'API doit fournir ceci
}

/**
 * Récupère les recommandations de profils à swiper.
 * (Endpoint supposé)
 */
export async function apiGetRecommendations(): Promise<SwipeProfile[]> {
  const res = await fetch(`${BASE}/api/recommendations`, { credentials: "include" });
  if (!res.ok) throw new Error("recommendations_fetch_failed");
  const data = await res.json();
  
  // Mapper les données de l'API vers le format SwipeProfile
  // (Exemple de mapping)
  return data.profiles.map((p: PublicProfile & { imageUrl: string, distanceKm: number }) => ({
     id: p.id,
     name: p.name,
     imageUrl: p.imageUrl || `https://via.placeholder.com/300x400/CCCCCC/FFFFFF?text=${p.name}`,
     commune: p.location_city,
     distanceKm: p.distanceKm || 0
  }));
}

/**
 * Envoie un swipe au backend et gère les erreurs de limite.
 * (Endpoint supposé)
 */
export async function apiSwipe(targetId: number, direction: 'left' | 'right'): Promise<{ ok: boolean, match?: boolean }> {
  const res = await fetch(`${BASE}/api/swipe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_id: targetId,
      direction: direction,
    }),
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      throw new Error("swipe_failed");
    }

    // Gérer les erreurs de limite spécifiques
    if (errorData?.error === "LikeLimitReached") {
      throw new LikeLimitReachedError();
    }
    if (errorData?.error === "TotalActionLimitReached") {
      throw new TotalActionLimitReachedError();
    }
    
    // Autre erreur backend
    throw new Error(errorData?.error || "swipe_failed");
  }

  return res.json(); // ex: { ok: true, match: false }
}

/**
 * Signale un utilisateur.
 * (Endpoint supposé : /api/report/<user_id>/)
 */
export async function reportUser(userId: number) {
  const res = await fetch(`${BASE}/api/report/${userId}/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // Envoyer un corps vide si nécessaire par le backend
  });

  if (!res.ok) {
    console.error('Erreur lors du signalement de l\'utilisateur:', res.statusText);
    try {
      const j = await res.json();
      throw new Error(j?.error || "report_failed");
    } catch {
      throw new Error("report_failed");
    }
  }
  
  return res.json(); // Renvoie la réponse de succès, ex: { ok: true }
}

/**
 * NOUVELLE FONCTION: Bloque un utilisateur.
 * (Endpoint supposé : /api/block/<user_id>/)
 * Assurez-vous que cet endpoint existe sur votre backend.
 */
export async function blockUser(userId: number) {
  const res = await fetch(`${BASE}/api/block/${userId}/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}), // Envoyer un corps vide
  });

  if (!res.ok) {
    console.error('Erreur lors du blocage de l\'utilisateur:', res.statusText);
    try {
      const j = await res.json();
      throw new Error(j?.error || "block_failed");
    } catch {
      throw new Error("block_failed");
    }
  }
  
  return res.json(); // Renvoie la réponse de succès, ex: { ok: true }
}