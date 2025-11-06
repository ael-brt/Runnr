// Runnr/src/pages/SwipePage.tsx
import React, { useState, MouseEvent } from "react";
import { MapPin } from 'lucide-react'; // 1. Importer l'icône de localisation
import "./SwipePage.css"; // 2. Importer le fichier CSS

// 3. Mettre à jour l'interface pour inclure la commune et la distance
interface Profile {
  id: number;
  name: string;
  imageUrl: string;
  commune: string;
  distanceKm: number;
}

// 4. Mettre à jour les données de test
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
];

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
  const [profiles, setProfiles] = useState(mockProfiles);
  const [dragState, setDragState] = useState(initialState);

  // Gère le début du glissement (clic ou appui)
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragState({
      ...initialState,
      isDragging: true,
      startX: e.clientX,
    });
  };

  // Gère le mouvement de la souris pendant le glissement
  const handleDragMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || profiles.length === 0) return;
    e.preventDefault();

    const deltaX = e.clientX - dragState.startX;
    // Simple calcul pour le deltaY (basé sur le centre vertical de l'écran)
    const deltaY = e.clientY - (window.innerHeight / 2); 

    setDragState((prev) => ({
      ...prev,
      deltaX: deltaX,
      deltaY: deltaY,
    }));
  };

  // Gère la fin du glissement (relâchement du clic)
  const handleDragEnd = () => {
    if (!dragState.isDragging) return;

    const swipeThreshold = 100; // 100px de mouvement pour valider un swipe

    if (Math.abs(dragState.deltaX) > swipeThreshold) {
      // Swipe réussi (gauche ou droite)
      console.log(dragState.deltaX > 0 ? "Swipe Droite" : "Swipe Gauche");
      // Retire le profil swipé de la liste
      setProfiles((prevProfiles) => prevProfiles.slice(1));
    }

    // Réinitialise l'état du glissement
    setDragState(initialState);
  };

  // Applique les transformations CSS à la carte active (celle du dessus)
  const getCardStyle = () => {
    if (!dragState.isDragging) {
      return {}; // Pas de transformation si on ne glisse pas
    }

    const rotation = dragState.deltaX * 0.1; // Rotation basée sur le mouvement X
    return {
      transform: `translateX(${dragState.deltaX}px) translateY(${dragState.deltaY / 3}px) rotate(${rotation}deg)`,
      transition: "none", // On ne veut pas d'animation pendant le glissement
    };
  };

  return (
    <div 
      className="swipe-page-container"
      // Écouteurs sur le conteneur pour un glissement fluide
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd} // Annule si la souris quitte la zone
    >
      <h2>Swipe Page</h2>
      <div className="swipe-card-deck">
        {profiles.length > 0 ? (
          profiles
            .map((profile, index) => {
              // On n'applique le style de glissement et les événements
              // qu'à la carte du dessus (index 0)
              if (index === 0) {
                return (
                  <div
                    key={profile.id}
                    className="swipe-card"
                    style={{ 
                      // 5. Utiliser la variable CSS pour l'image de fond
                      '--card-image-url': `url(${profile.imageUrl})`, 
                      ...getCardStyle(), // Applique le style de glissement
                      zIndex: 100, // Toujours au-dessus
                    }}
                    onMouseDown={handleDragStart}
                  >
                    {/* 6. Afficher les infos (nom, commune, distance) */}
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
              // Les autres cartes sont juste pour le visuel "stack"
              return (
                <div
                  key={profile.id}
                  className="swipe-card"
                  style={{
                    '--card-image-url': `url(${profile.imageUrl})`,
                    zIndex: 99 - index, // Z-index décroissant
                    transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`, 
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
            .reverse() // On inverse pour que l'index 0 soit le dernier (au-dessus)
        ) : (
          <div>Plus de profils à voir !</div>
        )}
      </div>
    </div>
  );
}