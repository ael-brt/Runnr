import { useState } from "react";
import { loginEmail } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function SignIn() {
  const backend = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const google = `${backend}/auth/google/login`;
  const facebook = `${backend}/auth/facebook/login`;
  const apple = `${backend}/auth/apple/login`;
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Se connecter</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await loginEmail({ email, password });
              nav("/dashboard");
            } catch (e) {
              setError("Identifiants invalides");
            }
          }}
        >
          <input className="border w-full p-2 rounded" placeholder="Email ou nom d'utilisateur" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border w-full p-2 rounded" placeholder="Mot de passe" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button className="border px-3 py-2 rounded w-full" type="submit">Se connecter</button>
        </form>
        <div className="flex justify-between text-sm">
          <Link to="/signup" className="underline">Créer un compte</Link>
          <Link to="/reset" className="underline">Mot de passe oublié ?</Link>
        </div>
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
