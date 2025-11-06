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
      <button className="border px-3 py-2 rounded" onClick={async () => {
        await logoutApi();
        nav("/signin");
      }}>
        Se déconnecter
      </button>
    </div>
  );
}
