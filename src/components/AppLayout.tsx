import { Outlet, NavLink } from 'react-router-dom';
import { Layers, User, LayoutDashboard } from 'lucide-react'; // Icônes pour la navigation
import './AppLayout.css'; // Nous allons créer ce fichier CSS

export default function AppLayout() {
  return (
    <div className="app-layout">
      {/* Le composant <Outlet /> est l'endroit où React Router 
        rendra le composant de la route enfant (Dashboard, Swipe, ou Profil) 
      */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Votre barre de navigation fixe en bas */}
      <nav className="bottom-nav">
        {/* On utilise NavLink au lieu de Link pour savoir quelle route est active */}
        <NavLink to="/dashboard" className="nav-link">
          <LayoutDashboard size={24} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/swipe" className="nav-link">
          <Layers size={24} />
          <span>Swipe</span>
        </NavLink>
        <NavLink to="/profil" className="nav-link">
          <User size={24} />
          <span>Profil</span>
        </NavLink>
      </nav>
    </div>
  );
}