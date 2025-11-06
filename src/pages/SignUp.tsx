import { useState } from "react";
import { registerEmail } from "../api";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const backend = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const google = `${backend}/auth/google/login`;
  const facebook = `${backend}/auth/facebook/login`;
  const apple = `${backend}/auth/apple/login`;

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Créer mon compte</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await registerEmail({ name, email, password });
              nav("/dashboard");
            } catch (e) {
              setError("Inscription impossible");
            }
          }}
        >
          <input className="border w-full p-2 rounded" placeholder="Nom" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="border w-full p-2 rounded" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border w-full p-2 rounded" placeholder="Mot de passe" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button className="border px-3 py-2 rounded w-full" type="submit">S'inscrire</button>
        </form>
        <div className="text-center text-sm text-neutral-500">ou</div>
        <div className="space-y-2">
          <a href={google} className="block w-full text-center border p-2 rounded">Continuer avec Google</a>
          <a href={facebook} className="block w-full text-center border p-2 rounded">Continuer avec Facebook</a>
          <a href={apple} className="block w-full text-center border p-2 rounded">Continuer avec Apple</a>
        </div>
      </div>
    </div>
  );
}

