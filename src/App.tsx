import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Profil from "./pages/Profil";
import SwipePage from "./pages/SwipePage"; // Assurez-vous que ce fichier existe

// 1. Importer le nouveau composant de layout
import AppLayout from "./components/AppLayout"; 

export default function App() {
  return (
    <Routes>
      {/* 2. Routes principales de l'application.
        Toutes les routes "enfants" de AppLayout (Dashboard, Swipe, Profil)
        s'afficheront À L'INTÉRIEUR du AppLayout (grâce à <Outlet />),
        et auront donc la barre de navigation.
      */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/swipe" element={<SwipePage />} />
        <Route path="/profil" element={<Profil />} />
      </Route>

      {/* 3. Rediriger la racine "/" vers la page de swipe par défaut.
      */}
      <Route path="/" element={<Navigate to="/swipe" replace />} />

      {/* Les autres routes (ex: /signin) n'utiliseront PAS le AppLayout
        et n'auront donc pas la barre de navigation.
      */}
      {/* <Route path="/signin" element={<SignIn />} /> */}

      {/* Route 404 pour tout ce qui ne correspond pas */}
      <Route path="*" element={<div>404 - Page non trouvée</div>} />
    </Routes>
  );
}