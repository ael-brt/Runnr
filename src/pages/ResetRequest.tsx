import { useState } from "react";
import { requestPasswordReset } from "../api";

export default function ResetRequest() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
        {sent ? (
          <div>Si un compte existe, un email a été envoyé.</div>
        ) : (
          <form className="space-y-2" onSubmit={async (e)=>{
            e.preventDefault();
            try {
              await requestPasswordReset(email);
              setSent(true);
            } catch (e) {
              setError("Impossible d'envoyer l'email");
            }
          }}>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <input className="border w-full p-2 rounded" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <button className="border px-3 py-2 rounded w-full" type="submit">Envoyer le lien</button>
          </form>
        )}
      </div>
    </div>
  );
}

