import { useEffect, useState } from "react";
import { getMe, logoutApi } from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => nav("/signin"))
      .finally(() => setLoading(false));
  }, [nav]);

  if (loading) return <div>Chargement…</div>;
  if (!me) return null;

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Bienvenue {me.name} ({me.email})</p>
      {typeof me.profile_completion === 'number' && me.profile_completion < 100 && (
        <div className="border p-3 rounded bg-yellow-50">
          <div className="font-semibold">Profil incomplet ({me.profile_completion}%)</div>
          <div className="text-sm">Il manque: {Array.isArray(me.profile_missing) ? me.profile_missing.join(', ') : ''}</div>
          <button className="mt-2 border px-3 py-2 rounded" onClick={()=> nav('/profile')}>Compléter mon profil</button>
        </div>
      )}
      <button className="border px-3 py-2 rounded" onClick={async () => {
        await logoutApi();
        nav("/signin");
      }}>
        Se déconnecter
      </button>
    </div>
  );
}
