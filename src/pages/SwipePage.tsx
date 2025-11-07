// Runnr/src/pages/SwipePage.tsx
import React, { useState, MouseEvent, useEffect } from "react";
import "./SwipePage.css"; // Importer le fichier CSS
import { 
  apiGetRecommendations, 
  apiSwipe, 
  LikeLimitReachedError, 
  TotalActionLimitReachedError, 
  SwipeProfile 
} from "../api"; // Importer les fonctions et types de l'API

// (L'interface Profile est maintenant importée en tant que SwipeProfile de api.ts)

// État pour le glissement (drag)
interface DragState {
  isDragging: boolean;
  startX: number; // Position X de départ du clic
  deltaX: number; // Mouvement horizontal
  deltaY: number; // Mouvement vertical (pour la rotation)
}

const initialState: DragState = {
  isDragging: false,
  startX: 0,
  deltaX: 0,
  deltaY: 0,
};

export default function SwipePage() {
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [dragState, setDragState] = useState(initialState);
  
  // Nouveaux états pour gérer le chargement, les erreurs et les limites
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState<'like' | 'total' | null>(null);

  // Charger les profils depuis l'API au montage
  useEffect(() => {
    setIsLoading(true);
    apiGetRecommendations()
      .then(data => {
        setProfiles(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Impossible de charger les profils.");
        setIsLoading(false);
      });
  }, []); // [] = exécuter une seule fois

  // Gère le début du glissement (clic ou appui)
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    // Ne pas commencer le drag si la limite est atteinte ou si pas de profil
    if (limitReached || profiles.length === 0) return;
    
    e.preventDefault();
    setDragState({
      ...initialState,
      isDragging: true,
      startX: e.clientX,
    });
  };

  // Gère le mouvement de la souris pendant le glissement
  const handleDragMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || profiles.length === 0 || limitReached) return;
    e.preventDefault();

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - (window.innerHeight / 2); 

    setDragState((prev) => ({
      ...prev,
      deltaX: deltaX,
      deltaY: deltaY,
    }));
  };

  // Gère la fin du glissement (relâchement du clic)
  const handleDragEnd = async () => {
    if (!dragState.isDragging || limitReached) return;

    const swipeThreshold = 100; // 100px de mouvement pour valider un swipe
    const direction = dragState.deltaX > 0 ? 'right' : 'left';
    const profileId = profiles.length > 0 ? profiles[0].id : null;

    if (Math.abs(dragState.deltaX) > swipeThreshold && profileId) {
      // Swipe réussi (gauche ou droite)
      
      // 1. Mise à jour optimiste de l'UI
      const swipedProfile = profiles[0];
      setProfiles((prevProfiles) => prevProfiles.slice(1));
      
      try {
        // 2. Appel API
        const result = await apiSwipe(profileId, direction);
        if (result.match) {
          // TODO: Gérer l'affichage d'un match
          alert("C'est un Match !");
        }
      } catch (err: any) {
        // 3. Gérer les erreurs (limites, etc.)
        if (err instanceof LikeLimitReachedError) {
          setLimitReached('like');
        } else if (err instanceof TotalActionLimitReachedError) {
          setLimitReached('total');
        } else {
          // Erreur réseau ou autre
          setError(err.message || "Erreur lors du swipe");
          // Annuler la mise à jour optimiste (remettre le profil)
          setProfiles(prev => [swipedProfile, ...prev]);
        }
      }
    }

    // Réinitialise l'état du glissement
    setDragState(initialState);
  };

  // Applique les transformations CSS à la carte active (celle du dessus)
  const getCardStyle = () => {
    if (!dragState.isDragging || limitReached) {
      return {}; // Pas de transformation
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
      <h2>Swipe Page</h2>
      
      {/* Affichage des erreurs générales */}
      {error && <div className="swipe-error-message">{error}</div>}
      
      <div className="swipe-card-deck">
        
        {/* NOUVEL OVERLAY DE LIMITE ATTEINTE */}
        {limitReached && (
          <div className="limit-overlay">
            <div className="limit-overlay-content">
              <h3>Limite atteinte</h3>
              {limitReached === 'like' && (
                <p>Vous avez utilisé vos 4 likes gratuits. Revenez demain ou passez Premium pour des likes illimités !</p>
              )}
              {limitReached === 'total' && (
                <p>Vous avez atteint votre limite de 10 actions aujourd'hui. Revenez demain ou passez Premium !</p>
              )}
              {/* <button>Devenir Premium</button> */}
            </div>
          </div>
        )}

        {isLoading ? (
          <div>Chargement des profils...</div>
        ) : profiles.length > 0 ? (
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
                    onMouseDown={handleDragStart} // Attaché ici
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
              // Les autres cartes
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
          !limitReached && <div>Plus de profils à voir ! Revenez plus tard.</div>
        )}
      </div>
    </div>
  );
}