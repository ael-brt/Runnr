// Runnr/src/pages/SwipePage.tsx
import React, { useState, MouseEvent, useMemo, useEffect } from "react";
// 1. Importer l'icône de filtre et l'icône de localisation
import { MapPin, SlidersHorizontal } from 'lucide-react'; 
import "./SwipePage.css"; 

// --- Données ---

// Mettre à jour l'interface
interface Profile {
  id: number;
  name: string;
  imageUrl: string;
  commune: string;
  distanceKm: number;
}

// 2. Déplacer les mocks à l'extérieur pour qu'ils
// servent de "source de vérité" constante
const masterProfileList: Profile[] = [
  { 
    id: 1, 
    name: "Alice", 
    imageUrl: "https://via.placeholder.com/300x400/FF0000/FFFFFF?text=Alice",
    commune: "Lyon",
    distanceKm: 5 // <= 5km
  },
  { 
    id: 2, 
    name: "Bob", 
    imageUrl: "https://via.placeholder.com/300x400/00FF00/FFFFFF?text=Bob",
    commune: "Villeurbanne",
    distanceKm: 2 // <= 5km
  },
  { 
    id: 3, 
    name: "Charlie", 
    imageUrl: "https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Charlie",
    commune: "Paris",
    distanceKm: 450 // > 25km
  },
  { 
    id: 4, 
    name: "Dana", 
    imageUrl: "https://via.placeholder.com/300x400/FFFF00/000000?text=Dana",
    commune: "Bron",
    distanceKm: 8 // <= 10km
  },
  { 
    id: 5, 
    name: "Eve", 
    imageUrl: "https://via.placeholder.com/300x400/FF00FF/FFFFFF?text=Eve",
    commune: "Vénissieux",
    distanceKm: 12 // <= 25km
  },
];

// --- État de glissement (Drag) ---
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

// --- Options de filtre ---
const distanceOptions = [5, 10, 25];

// --- Composant Principal ---
export default function SwipePage() {
  
  // 3. Nouvel état pour le filtre de distance (par défaut à 25km)
  const [selectedDistance, setSelectedDistance] = useState<number>(25);
  
  // 4. Nouvel état pour la pile de cartes *actives*
  // (celles qui sont filtrées et pas encore swipées)
  const [activeProfiles, setActiveProfiles] = useState<Profile[]>([]);
  
  // État pour le glissement
  const [dragState, setDragState] = useState(initialState);

  // 5. Logique de filtrage
  // Calcule la liste filtrée à partir de la liste "master"
  const filteredProfiles = useMemo(() => {
    console.log(`Filtrage pour ${selectedDistance} km`);
    return masterProfileList.filter(p => p.distanceKm <= selectedDistance);
  }, [selectedDistance]);

  // 6. Mettre à jour la pile de cartes lorsque le filtre change
  // (Cela réinitialise la pile)
  useEffect(() => {
    setActiveProfiles(filteredProfiles);
  }, [filteredProfiles]); // Se déclenche quand filteredProfiles est recalculé


  // Gère le début du glissement
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragState({
      ...initialState,
      isDragging: true,
      startX: e.clientX,
    });
  };

  // Gère le mouvement de la souris
  const handleDragMove = (e: MouseEvent<HTMLDivElement>) => {
    // 7. Mettre à jour la condition pour vérifier la pile active
    if (!dragState.isDragging || activeProfiles.length === 0) return;
    e.preventDefault();

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - (window.innerHeight / 2); 

    setDragState((prev) => ({ ...prev, deltaX, deltaY }));
  };

  // Gère la fin du glissement
  const handleDragEnd = () => {
    if (!dragState.isDragging) return;

    const swipeThreshold = 100; 

    if (Math.abs(dragState.deltaX) > swipeThreshold) {
      console.log(dragState.deltaX > 0 ? "Swipe Droite" : "Swipe Gauche");
      
      // 8. Mettre à jour la pile active
      setActiveProfiles((prevProfiles) => prevProfiles.slice(1));
    }

    setDragState(initialState);
  };

  // Applique les transformations CSS à la carte active
  const getCardStyle = () => {
    if (!dragState.isDragging) return {}; 
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
      
      {/* 9. Section des Filtres */}
      <div className="filter-container">
        <div className="filter-label">
          <SlidersHorizontal size={16} />
          <span>Distance max</span>
        </div>
        <div className="filter-options">
          {distanceOptions.map((distance) => (
            <button
              key={distance}
              // Applique la classe 'active' si la distance est sélectionnée
              className={`filter-btn ${selectedDistance === distance ? 'active' : ''}`}
              onClick={() => setSelectedDistance(distance)}
            >
              {distance} km
            </button>
          ))}
        </div>
      </div>
      
      {/* 10. Mettre à jour la pile de cartes pour utiliser 'activeProfiles' */}
      <div className="swipe-card-deck">
        {activeProfiles.length > 0 ? (
          activeProfiles
            .map((profile, index) => {
              // Carte du dessus (celle qu'on swiper)
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
                        <MapPin size={16} className="location-icon" />
                        <span>{profile.commune} (à {profile.distanceKm} km)</span>
                      </div>
                    </div>
                  </div>
                );
              }
              // Cartes en dessous (pour l'effet de pile)
              return (
                <div
                  key={profile.id}
                  className="swipe-card"
                  style={{
                    '--card-image-url': `url(${profile.imageUrl})`,
                    zIndex: 99 - index, 
                    transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`, 
                    opacity: (1 - index * 0.1) // Optionnel: fondre les cartes en dessous
                  }}
                >
                  <div className="swipe-card-info">
                    <h3>{profile.name}</h3>
                    <div className="swipe-card-location">
                      <MapPin size={16} className="location-icon" />
                      <span>{profile.commune} (à {profile.distanceKm} km)</span>
                    </div>
                  </div>
                </div>
              );
            })
            .reverse() 
        ) : (
          // 11. Message si aucun profil ne correspond au filtre
          <div className="no-profiles-message">
            Aucun profil trouvé à moins de {selectedDistance} km.
          </div>
        )}
      </div>
    </div>
  );
}