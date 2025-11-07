import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getMe } from "../api";

export default function ProtectedRoute() {
  const [ok, setOk] = useState<null | boolean>(null);
  const loc = useLocation();

  useEffect(() => {
    let mounted = true;
    getMe().then(
      () => mounted && setOk(true),
      () => mounted && setOk(false)
    );
    return () => {
      mounted = false;
    };
  }, [loc.pathname]);

  if (ok === null) return <div className="p-6">Chargement…</div>;
  if (!ok) return <Navigate to="/signin" replace />;
  return <Outlet />;
}

