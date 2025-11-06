import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordConfirm } from "../api";

export default function ResetConfirm() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const uid = useMemo(()=> sp.get("uid") || "", [sp]);
  const token = useMemo(()=> sp.get("token") || "", [sp]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
        {ok ? (
          <div className="space-y-2">
            <div>Mot de passe modifié avec succès.</div>
            <button className="border px-3 py-2 rounded" onClick={()=>nav("/signin")}>Se connecter</button>
          </div>
        ) : (
          <form className="space-y-2" onSubmit={async (e)=>{
            e.preventDefault();
            try {
              await resetPasswordConfirm({ uid, token, password });
              setOk(true);
            } catch (e) {
              setError("Lien invalide ou expiré");
            }
          }}>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <input className="border w-full p-2 rounded" placeholder="Nouveau mot de passe" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button className="border px-3 py-2 rounded w-full" type="submit">Changer le mot de passe</button>
          </form>
        )}
      </div>
    </div>
  );
}

