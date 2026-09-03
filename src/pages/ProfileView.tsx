import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProfile, type PublicProfile } from "../api";

export default function ProfileView() {
  const { id } = useParams();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPublicProfile(id).then(setP).catch(()=> setError("Profil introuvable"));
  }, [id]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!p) return <div className="p-6">Chargement…</div>;

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">{p.name}</h1>
      <div>Niveau: {p.level || "—"}</div>
      <div>Ville: {p.location_city || "—"}</div>
      <div>Objectifs: {p.goals || "—"}</div>
      <div>Distances: {p.distances || "—"}</div>
      <div>Vitesse moyenne: {p.speed_kmh ? `${p.speed_kmh} km/h` : "—"}</div>
    </div>
  );
}

