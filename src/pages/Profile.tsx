import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, type Profile } from "../api";

export default function ProfilePage() {
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {
        setError("Impossible de charger le profil");
        nav("/signin");
      });
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateProfile(profile);
      setProfile(await getProfile());
    } catch (e) {
      setError("Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Mon profil sportif</h1>
      {typeof profile.completion === "number" && (
        <div className="text-sm">Complétude: {profile.completion}% {profile.missing && profile.missing.length ? `(manque: ${profile.missing.join(", ")})` : null}</div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="space-y-2 max-w-md">
        <label className="block">
          <span className="text-sm">Niveau</span>
          <select className="border w-full p-2 rounded" value={profile.level}
            onChange={(e)=> setProfile({ ...profile, level: e.target.value })}>
            <option value="">—</option>
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm">Ville</span>
          <input className="border w-full p-2 rounded" value={profile.location_city}
            onChange={(e)=> setProfile({ ...profile, location_city: e.target.value })} />
        </label>

        <label className="block">
          <span className="text-sm">Objectifs</span>
          <textarea className="border w-full p-2 rounded" rows={3} value={profile.goals}
            onChange={(e)=> setProfile({ ...profile, goals: e.target.value })} />
        </label>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={profile.availability_week}
              onChange={(e)=> setProfile({ ...profile, availability_week: e.target.checked })} />
            Semaine
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={profile.availability_weekend}
              onChange={(e)=> setProfile({ ...profile, availability_weekend: e.target.checked })} />
            Week-end
          </label>
        </div>

        <label className="block">
          <span className="text-sm">Distances (ex: 5k,10k,semi)</span>
          <input className="border w-full p-2 rounded" value={profile.distances || ""}
            onChange={(e)=> setProfile({ ...profile, distances: e.target.value })} />
        </label>

        <label className="block">
          <span className="text-sm">Vitesse moyenne (km/h)</span>
          <input className="border w-full p-2 rounded" type="number" step="0.1" value={profile.speed_kmh ?? ""}
            onChange={(e)=> setProfile({ ...profile, speed_kmh: e.target.value === "" ? null : Number(e.target.value) })} />
        </label>

        <button className="border px-3 py-2 rounded" disabled={saving} onClick={save}>
          {saving ? "Sauvegarde…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
