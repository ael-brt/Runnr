export default function SignIn() {
  const backend = "http://localhost:8000";
  const loginUrl = `${backend}/auth/google/login`;

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Créer mon compte</h1>
        <a
          href={loginUrl}
          className="block w-full text-center border p-2 rounded"
        >
          Continuer avec Google
        </a>
        <p className="text-xs text-neutral-500">
          Redirection sécurisée via Google. Aucun post sans consentement.
        </p>
      </div>
    </div>
  );
}
