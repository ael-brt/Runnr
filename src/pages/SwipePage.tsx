// Runnr/src/pages/SwipePage.tsx
import React, { useState, MouseEvent } from "react";
import "./SwipePage.css"; 
// 1. Importer l'API et l'erreur personnalisée
import { likeUser, LikeLimitError } from "../api"; 

interface Profile {
  id: number;
  name: string;
  imageUrl: string;
  commune: string;
  distanceKm: number;
}

// 2. Mettre à jour les données de test (AJOUT d'un 5ème profil pour tester la limite de 4)
const mockProfiles: Profile[] = [
  { 
    id: 1, 
    name: "Alice", 
    imageUrl: "https://via.placeholder.com/300x400/FF0000/FFFFFF?text=Alice",
    commune: "Lyon",
    distanceKm: 5
  },
  { 
    id: 2, 
    name: "Bob", 
    imageUrl: "https://via.placeholder.com/300x400/00FF00/FFFFFF?text=Bob",
    commune: "Villeurbanne",
    distanceKm: 2
  },
  { 
    id: 3, 
    name: "Charlie", 
    imageUrl: "https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Charlie",
    commune: "Paris",
    distanceKm: 450 
  },
  { 
    id: 4, 
    name: "Dana", 
    imageUrl: "https://via.placeholder.com/300x400/FFFF00/000000?text=Dana",
    commune: "Bron",
    distanceKm: 8
  },
  { 
    id: 5, 
    name: "Eve (test limite)", 
    imageUrl: "https://via.placeholder.com/300x400/00FFFF/000000?text=Eve",
    commune: "Vénissieux",
    distanceKm: 7
  },
];

interface DragState {
  isDragging: boolean;
  startX: number; 
  deltaX: number; 
  deltaY: number; 
}

const initialState: DragState = {
  isDragging: false,
  startX: 0,
  deltaX: 0,
  deltaY: 0,
};

export default function SwipePage() {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [dragState, setDragState] = useState(initialState);

  // 3. Ajouter l'état pour la modale
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");

  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragState({
      ...initialState,
      isDragging: true,
      startX: e.clientX,
    });
  };

  const handleDragMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || profiles.length === 0) return;
    e.preventDefault();

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - (window.innerHeight / 2); 

    setDragState((prev) => ({
      ...prev,
      deltaX: deltaX,
      deltaY: deltaY,
    }));
  };

  // 4. Mettre à jour 'handleDragEnd' pour appeler l'API
  const handleDragEnd = async () => {
    if (!dragState.isDragging) return;

    const swipeThreshold = 100;
    const swipedProfile = profiles[0];

    // --- GESTION DU SWIPE DROIT (LIKE) ---
    if (dragState.deltaX > swipeThreshold) {
      if (!swipedProfile) return;

      try {
        // 4a. Appeler l'API
        console.log(`Tentative de like: ${swipedProfile.name} (ID: ${swipedProfile.id})`);
        const result = await likeUser(swipedProfile.id);
        
        // 4b. Si l'API réussit, retirer le profil
        console.log("Like réussi:", result);
        setProfiles((prevProfiles) => prevProfiles.slice(1));
        
        if (result.is_match) {
          alert("C'est un Match !"); // À remplacer par une modale de match
        }

      } catch (error) {
        // 4c. Si l'API échoue
        if (error instanceof LikeLimitError) {
          // Cas spécifique: Limite 429 atteinte
          console.warn("Limite de likes atteinte:", error.message);
          setLimitMessage(error.message); // Message venant du backend
          setShowLimitModal(true);
        } else {
          // Autres erreurs (500, 404, réseau)
          console.error("Erreur inconnue lors du like:", error);
          setLimitMessage("Une erreur est survenue. Réessayez plus tard.");
          setShowLimitModal(true);
        }
        // IMPORTANT: Ne pas retirer le profil si le like a échoué
      }

    // --- GESTION DU SWIPE GAUCHE (NOPE) ---
    } else if (dragState.deltaX < -swipeThreshold) {
      console.log(`Swipe Gauche: ${swipedProfile?.name}`);
      // Pas besoin d'API, on retire juste le profil
      setProfiles((prevProfiles) => prevProfiles.slice(1));
    }

    // Réinitialise l'état du glissement
    setDragState(initialState);
  };

  // (Cette fonction reste inchangée)
  const getCardStyle = () => {
    if (!dragState.isDragging) {
      return {}; 
    }
    const rotation = dragState.deltaX * 0.1; 
    return {
      transform: `translateX(${dragState.deltaX}px) translateY(${dragState.deltaY / 3}px) rotate(${rotation}deg)`,
      transition: "none", 
    };
  };

  return (
    <div 
      className="swipe-page-container"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd} 
    >
      {/* 5. AJOUTER LA MODALE (popup) */}
      {showLimitModal && (
        <div className="limit-modal-overlay">
          <div className="limit-modal-content">
            <h3>Limite atteinte</h3>
            <p>{limitMessage}</p>
            <p>Revenez demain pour swiper à nouveau !</p>
            <button 
              className="limit-modal-button"
              onClick={() => setShowLimitModal(false)}
            >
              Compris
            </button>
          </div>
        </div>
      )}

      <h2>Swipe Page</h2>
      <div className="swipe-card-deck">
        {profiles.length > 0 ? (
          profiles
            .map((profile, index) => {
              if (index === 0) {
                return (
                  <div
                    key={profile.id}
                    className="swipe-card"
                    style={{ 
                      '--card-image-url': `url(${profile.imageUrl})`, 
                      ...getCardStyle(), 
                      zIndex: 100,
                    }}
                    onMouseDown={handleDragStart}
                  >
                    <div className="swipe-card-info">
                      <h3>{profile.name}</h3>
                      <div className="swipe-card-location">
                        <span className="location-icon" role="img" aria-label="localisation">📍</span>
                        <span>{profile.commune} (à {profile.distanceKm} km)</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={profile.id}
                  className="swipe-card"
                  style={{
                    '--card-image-url': `url(${profile.imageUrl})`,
                    zIndex: 99 - index, 
                    transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`, 
                  }}
                >
                  <div className="swipe-card-info">
                    <h3>{profile.name}</h3>
                    <div className="swipe-card-location">
                      <span className="location-icon" role="img" aria-label="localisation">📍</span>
                      <span>{profile.commune} (à {profile.distanceKm} km)</span>
                    </div>
                  </div>
                </div>
              );
            })
            .reverse() 
        ) : (
          <div>Plus de profils à voir !</div>
        )}
      </div>
    </div>
  );
}