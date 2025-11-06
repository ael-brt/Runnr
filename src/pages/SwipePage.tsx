// Runnr/src/pages/SwipePage.tsx
import React, { useState, MouseEvent, useMemo, useEffect } from "react";
// 1. Importer les icônes pour les filtres et les cartes
import { MapPin, SlidersHorizontal, Gauge } from 'lucide-react'; 
import "./SwipePage.css"; 

// --- Types et Données ---

// 2. Définir le type pour le niveau
type Level = 'Tous' | 'Débutant' | 'Intermédiaire' | 'Confirmé';

// 3. Mettre à jour l'interface Profile
interface Profile {
  id: number;
  name: string;
  imageUrl: string;
  commune: string;
  distanceKm: number;
  level: Omit<Level, 'Tous'>; // Le niveau d'un profil ne peut pas être 'Tous'
}

// 4. Mettre à jour la "source de vérité" avec les niveaux
const masterProfileList: Profile[] = [
  { 
    id: 1, 
    name: "Alice", 
    imageUrl: "https://via.placeholder.com/300x400/FF0000/FFFFFF?text=Alice",
    commune: "Lyon",
    distanceKm: 5,
    level: 'Intermédiaire'
  },
  { 
    id: 2, 
    name: "Bob", 
    imageUrl: "https://via.placeholder.com/300x400/00FF00/FFFFFF?text=Bob",
    commune: "Villeurbanne",
    distanceKm: 2,
    level: 'Débutant'
  },
  { 
    id: 3, 
    name: "Charlie", 
    imageUrl: "https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Charlie",
    commune: "Paris",
    distanceKm: 450,
    level: 'Confirmé'
  },
  { 
    id: 4, 
    name: "Dana", 
    imageUrl: "https://via.placeholder.com/300x400/FFFF00/000000?text=Dana",
    commune: "Bron",
    distanceKm: 8,
    level: 'Intermédiaire'
  },
  { 
    id: 5, 
    name: "Eve", 
    imageUrl: "https://via.placeholder.com/300x400/FF00FF/FFFFFF?text=Eve",
    commune: "Vénissieux",
    distanceKm: 12,
    level: 'Débutant'
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
const levelOptions: Level[] = ['Tous', 'Débutant', 'Intermédiaire', 'Confirmé'];

// --- Composant Principal ---
export default function SwipePage() {
  
  // États des filtres
  const [selectedDistance, setSelectedDistance] = useState<number>(25);
  // 5. Nouvel état pour le filtre de niveau
  const [selectedLevel, setSelectedLevel] = useState<Level>('Tous');
  
  // Pile de cartes actives (filtrées et non swipées)
  const [activeProfiles, setActiveProfiles] = useState<Profile[]>([]);
  
  // État pour le glissement
  const [dragState, setDragState] = useState(initialState);

  // 6. Logique de filtrage (useMemo)
  // Se met à jour si la distance OU le niveau change
  const filteredProfiles = useMemo(() => {
    console.log(`Filtrage pour: ${selectedDistance} km ET ${selectedLevel}`);
    
    // Étape 1: Filtrer par distance
    let profiles = masterProfileList.filter(p => p.distanceKm <= selectedDistance);
    
    // Étape 2: Filtrer par niveau (si 'Tous' n'est pas sélectionné)
    if (selectedLevel !== 'Tous') {
      profiles = profiles.filter(p => p.level === selectedLevel);
    }
    
    return profiles;
  // 7. Ajouter selectedLevel aux dépendances
  }, [selectedDistance, selectedLevel]);

  // Mettre à jour la pile de cartes lorsque les filtres changent
  useEffect(() => {
    setActiveProfiles(filteredProfiles);
  }, [filteredProfiles]); 


  // --- Logique de Swipe ---

  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragState({
      ...initialState,
      isDragging: true,
      startX: e.clientX,
    });
  };

  const handleDragMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || activeProfiles.length === 0) return;
    e.preventDefault();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - (window.innerHeight / 2); 
    setDragState((prev) => ({ ...prev, deltaX, deltaY }));
  };

  const handleDragEnd = () => {
    if (!dragState.isDragging) return;
    const swipeThreshold = 100; 

    if (Math.abs(dragState.deltaX) > swipeThreshold) {
      console.log(dragState.deltaX > 0 ? "Swipe Droite" : "Swipe Gauche");
      setActiveProfiles((prevProfiles) => prevProfiles.slice(1));
    }
    setDragState(initialState);
  };

  const getCardStyle = () => {
    if (!dragState.isDragging) return {}; 
    const rotation = dragState.deltaX * 0.1; 
    return {
      transform: `translateX(${dragState.deltaX}px) translateY(${dragState.deltaY / 3}px) rotate(${rotation}deg)`,
      transition: "none", 
    };
  };

  // --- Rendu JSX ---

  const renderProfileCard = (profile: Profile, index: number) => {
    const isTopCard = index === 0;

    return (
      <div
        key={profile.id}
        className="swipe-card"
        style={{ 
          '--card-image-url': `url(${profile.imageUrl})`, 
          zIndex: 100 - index, 
          transform: isTopCard 
            ? getCardStyle().transform 
            : `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
          transition: isTopCard ? getCardStyle().transition : 'transform 0.3s ease-out',
          opacity: (1 - index * 0.1)
        }}
        // N'attacher les événements de drag que sur la carte du dessus
        onMouseDown={isTopCard ? handleDragStart : undefined}
      >
        <div className="swipe-card-info">
          <h3>{profile.name}</h3>
          
          {/* 8. Afficher le niveau sur la carte */}
          <div className="swipe-card-level">
            <Gauge size={16} className="level-icon" />
            <span>{profile.level}</span>
          </div>
          
          <div className="swipe-card-location">
            <MapPin size={16} className="location-icon" />
            <span>{profile.commune} (à {profile.distanceKm} km)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="swipe-page-container"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd} 
    >
      
      {/* 9. Conteneur des filtres (regroupant les deux) */}
      <div className="filter-container">
        
        {/* Filtre Distance */}
        <div className="filter-label">
          <SlidersHorizontal size={16} />
          <span>Distance max</span>
        </div>
        <div className="filter-options">
          {distanceOptions.map((distance) => (
            <button
              key={distance}
              className={`filter-btn ${selectedDistance === distance ? 'active' : ''}`}
              onClick={() => setSelectedDistance(distance)}
            >
              {distance} km
            </button>
          ))}
        </div>
        
        {/* 10. Filtre Niveau */}
        <div className="filter-label filter-label-secondary"> {/* Classe pour marge */}
          <Gauge size={16} />
          <span>Niveau partenaire</span>
        </div>
        <div className="filter-options">
          {levelOptions.map((level) => (
            <button
              key={level}
              className={`filter-btn ${selectedLevel === level ? 'active' : ''}`}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      
      {/* Pile de cartes */}
      <div className="swipe-card-deck">
        {activeProfiles.length > 0 ? (
          activeProfiles.map(renderProfileCard).reverse()
        ) : (
          // 11. Message "aucun profil" mis à jour
          <div className="no-profiles-message">
            Aucun profil ne correspond à vos filtres.
          </div>
        )}
      </div>
    </div>
  );
}