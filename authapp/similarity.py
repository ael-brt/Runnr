# authapp/similarity.py
from math import sqrt
import re

# -------- Helpers génériques --------

def _get(obj, name, default=None):
    """getattr sûr, compatible avec des modèles partiels."""
    return getattr(obj, name, default)

def _safe_float(v, default=0.0):
    if v is None:
        return default
    try:
        return float(v)
    except Exception:
        return default

def _norm(v, maxi):
    """Normalise 0..maxi vers 0..1 (borne à 1)."""
    v = _safe_float(v, 0.0)
    return max(0.0, min(1.0, v / float(maxi if maxi else 1)))

# -------- Parsing optionnel des performances côté profil --------
# Ex.: "10km en 45min", "5km en 20min", "Semi-marathon en 1h45", etc.

RE_TIME = re.compile(
    r"(?:(?P<h>\d+)\s*h)?\s*(?:(?P<m>\d+)\s*min)?\s*(?:(?P<s>\d+)\s*s)?",
    re.IGNORECASE
)

def _time_to_seconds(txt):
    if not txt:
        return None
    m = RE_TIME.search(txt)
    if not m:
        return None
    h = int(m.group("h") or 0)
    mi = int(m.group("m") or 0)
    s = int(m.group("s") or 0)
    return h * 3600 + mi * 60 + s

def _extract_perf_seconds(perf_list, distance_km):
    """
    Cherche dans performance[] une entrée pour {distance_km} km
    et retourne le 'pace' (s/km) si on arrive à parser.
    """
    if not perf_list:
        return None
    # heuristiques simples
    dist_patterns = {
        5: r"\b5\s*km\b",
        10: r"\b10\s*km\b",
        21.1: r"\b(semi|21[.,]?\s*1\s*km)\b",
        42.2: r"\b(marathon|42[.,]?\s*2\s*km)\b",
    }
    pat = dist_patterns.get(distance_km, rf"\b{distance_km}\s*km\b")
    for entry in perf_list:
        if not isinstance(entry, str):
            continue
        if re.search(pat, entry, flags=re.IGNORECASE):
            # extraire une durée dans l'entrée
            sec = _time_to_seconds(entry)
            if sec and distance_km > 0:
                return sec / float(distance_km)  # s/km
    return None

# -------- Construction du vecteur de features --------

def feature_vector(profile):
    """
    Construit un vecteur [0..1] à partir des infos disponibles.
    Plus un champ est présent, plus la similarité est fiable.
    Les normalisations (bornes) sont volontairement larges.
    """
    v = []

    # 1) Métriques d'entraînement si présentes (back-end historique)
    pace = _get(profile, "avg_pace_s_per_km", None)            # s/km
    if pace is not None:
        v.append(_norm(pace, 600.0))                           # 0–10:00/km

    weekly_km = _get(profile, "weekly_km", None)
    if weekly_km is not None:
        v.append(_norm(weekly_km, 120.0))                      # 0–120 km

    long_run_km = _get(profile, "long_run_km", None)
    if long_run_km is not None:
        v.append(_norm(long_run_km, 40.0))                     # 0–40 km

    elevation = _get(profile, "elevation_per_week", None)
    if elevation is not None:
        v.append(_norm(elevation, 3000.0))                     # 0–3000 m

    prefered = _get(profile, "prefered_distance_km", None)
    if prefered is not None:
        v.append(_norm(prefered, 42.0))                        # 0–42 km

    # 2) Champs front “profil” si présents (âge/poids/taille/genre)
    age = _get(profile, "age", None)
    if age is not None:
        v.append(_norm(age, 100.0))                            # 0–100 ans

    poids = _get(profile, "poids", None)
    if poids is not None:
        v.append(_norm(poids, 120.0))                          # 0–120 kg

    taille = _get(profile, "taille", None)
    if taille is not None:
        v.append(_norm(taille, 210.0))                         # 0–210 cm

    # 3) Parsing des performances textuelles (optionnel)
    perf = _get(profile, "performance", None) or _get(profile, "performances", None)
    # essaie d'obtenir des allures ‘réelles’ sur 5/10/Semi/Marathon
    for dk in (5, 10, 21.1, 42.2):
        p = _extract_perf_seconds(perf, dk)
        if p is not None:
            v.append(_norm(p, 600.0))                          # 0–10:00/km

    # v peut être vide si aucun champ présent → on retournera [] et
    # la similarité sera non-pertinente (gérée en aval).
    return v

def euclidean_similarity(a_vec, b_vec):
    """Score 0–1 (1 = identique) avec gestion de vecteurs de tailles différentes."""
    if not a_vec or not b_vec:
        return 0.0
    L = min(len(a_vec), len(b_vec))
    if L == 0:
        return 0.0
    dist = sqrt(sum((a_vec[i] - b_vec[i]) ** 2 for i in range(L)))
    # borne ~ sqrt(L), on ramène 0..sqrt(L) -> 1..0
    return max(0.0, 1.0 - dist / (L ** 0.5))

def rule_of_thumb_flags(a, b):
    """
    Règles Free lisibles côté UI, inspirées de ton composant :
    - allure ±60s/km si on l’a
    - volume hebdo ±30% si on l’a
    - âge ±5 ans si on l’a
    - genre identique si présent des 2 côtés (bonus)
    """
    checks = {}
    # allure
    pa, pb = _get(a, "avg_pace_s_per_km", None), _get(b, "avg_pace_s_per_km", None)
    if pa is not None and pb is not None:
        checks["pace_ok"] = abs(_safe_float(pa) - _safe_float(pb)) <= 60
    # volume
    wa, wb = _get(a, "weekly_km", None), _get(b, "weekly_km", None)
    if wa is not None and wb is not None:
        m = max(_safe_float(wa), _safe_float(wb), 1.0)
        checks["weekly_ok"] = abs(_safe_float(wa) - _safe_float(wb)) <= 0.3 * m
    # âge
    aa, ab = _get(a, "age", None), _get(b, "age", None)
    if aa is not None and ab is not None:
        checks["age_ok"] = abs(_safe_float(aa) - _safe_float(ab)) <= 5
    # genre (bonus, pas bloquant)
    ga, gb = _get(a, "genre", None), _get(b, "genre", None)
    if ga and gb:
        checks["same_gender"] = str(ga).strip().lower() == str(gb).strip().lower()
    return checks

def is_similar(profile_me, profile_other):
    """
    Combine score euclidien + règles FREE.
    Retourne (score, similar_bool, details_dict)
    """
    va = feature_vector(profile_me)
    vb = feature_vector(profile_other)
    score = euclidean_similarity(va, vb)

    rules = rule_of_thumb_flags(profile_me, profile_other)
    # décision FREE : score >= 0.70 + (pace_ok ou weekly_ok)
    pace_ok = rules.get("pace_ok", True)  # si inconnu, on n’empêche pas
    weekly_ok = rules.get("weekly_ok", True)
    similar = (score >= 0.70) and (pace_ok or weekly_ok)

    # diffs lisibles (affichage dans le badge côté front)
    diffs = {}
    # diffs simples si les champs existent
    for name in ("avg_pace_s_per_km", "weekly_km", "prefered_distance_km", "age", "poids", "taille"):
        am = _get(profile_me, name, None)
        ao = _get(profile_other, name, None)
        if am is not None and ao is not None:
            diffs[f"{name}_diff"] = abs(_safe_float(am) - _safe_float(ao))

    details = {
        "rules": rules,
        "used_dims_me": len(va),
        "used_dims_other": len(vb),
        "diffs": diffs,
    }
    return score, similar, details
