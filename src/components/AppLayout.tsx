import { Outlet, NavLink, useNavigate } from 'react-router-dom';
// Icônes remplacées par des emoji pour éviter une dépendance
import './AppLayout.css'; // Nous allons créer ce fichier CSS
import { logoutApi } from '../api';

export default function AppLayout() {
  const nav = useNavigate();
  return (
    <div className="app-layout">
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="logo">Runnr</div>
          <div className="spacer" />
          <button className="logout-btn" onClick={async ()=>{ await logoutApi(); nav('/signin'); }}>Déconnexion</button>
        </div>
      </header>
      {/* Zone de rendu des routes protégées */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Votre barre de navigation fixe en bas */}
      <nav className="bottom-nav">
        {/* On utilise NavLink au lieu de Link pour savoir quelle route est active */}
        <NavLink to="/dashboard" className="nav-link">
          <span role="img" aria-label="dashboard">📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/swipe" className="nav-link">
          <span role="img" aria-label="swipe">🤝</span>
          <span>Swipe</span>
        </NavLink>
        <NavLink to="/profile" className="nav-link">
          <span role="img" aria-label="profil">👤</span>
          <span>Profil</span>
        </NavLink>
      </nav>
    </div>
  );
}
