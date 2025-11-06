// Runnr/src/pages/SwipePage.tsx
import React, { useState, MouseEvent, useMemo, useEffect } from "react";
// 1. Importer les icônes (X pour fermer la modale, Calendar pour dispos)
import { MapPin, SlidersHorizontal, Gauge, X, Calendar } from 'lucide-react'; 
import "./SwipePage.css"; 

// --- Types et Données ---

// 2. Nouveaux types pour les filtres
type Level = 'Tous' | 'Débutant' | 'Intermédiaire' | 'Confirmé';
type Genre = 'Tous' | 'Homme' | 'Femme';
type AgeRange = 'Tous' | '18-25' | '26-35' | '36+';

// NOUVEAU: Type pour les disponibilités
type AvailabilitySlot = 
  'Semaine - Matin' | 'Semaine - Midi' | 'Semaine - Soir' |
  'Weekend - Matin' | 'Weekend - Midi' | 'Weekend - Soir';

// 3. Mettre à jour l'interface Profile
interface Profile {
  id: number;
  name: string;
  age: number; 
  genre: 'Homme' | 'Femme'; 
  imageUrl: string;
  commune: string;
  distanceKm: number;
  level: Omit<Level, 'Tous'>;
  availability: AvailabilitySlot[]; // NOUVEAU
}

// 4. Mettre à jour la "source de vérité"
const masterProfileList: Profile[] = [
  { 
    id: 1, name: "Alice", age: 24, genre: 'Femme',
    imageUrl: "https://via.placeholder.com/300x400/FF0000/FFFFFF?text=Alice",
    commune: "Lyon", distanceKm: 5, level: 'Intermédiaire',
    availability: ['Semaine - Soir', 'Weekend - Matin'] // NOUVEAU
  },
  { 
    id: 2, name: "Bob", age: 19, genre: 'Homme',
    imageUrl: "https://via.placeholder.com/300x400/00FF00/FFFFFF?text=Bob",
    commune: "Villeurbanne", distanceKm: 2, level: 'Débutant',
    availability: ['Semaine - Matin', 'Semaine - Midi'] // NOUVEAU
  },
  { 
    id: 3, name: "Charlie", age: 38, genre: 'Homme',
    imageUrl: "https://via.placeholder.com/300x400/0000FF/FFFFFF?text=Charlie",
    commune: "Paris", distanceKm: 450, level: 'Confirmé',
    availability: ['Weekend - Matin', 'Weekend - Midi', 'Weekend - Soir'] // NOUVEAU
  },
  { 
    id: 4, name: "Dana", age: 29, genre: 'Femme',
    imageUrl: "https://via.placeholder.com/300x400/FFFF00/000000?text=Dana",
    commune: "Bron", distanceKm: 8, level: 'Intermédiaire',
    availability: ['Semaine - Soir'] // NOUVEAU
  },
  { 
    id: 5, name: "Eve", age: 31, genre: 'Femme',
    imageUrl: "https://via.placeholder.com/300x400/FF00FF/FFFFFF?text=Eve",
    commune: "Vénissieux", distanceKm: 12, level: 'Débutant',
    availability: ['Weekend - Midi'] // NOUVEAU
  },
];

// --- État de glissement (Drag) ---
interface DragState { isDragging: boolean; startX: number; deltaX: number; deltaY: number; }
const initialState: DragState = { isDragging: false, startX: 0, deltaX: 0, deltaY: 0 };

// --- Options de filtre ---
const distanceOptions = [5, 10, 25, 50]; 
const levelOptions: Level[] = ['Tous', 'Débutant', 'Intermédiaire', 'Confirmé'];
const genreOptions: Genre[] = ['Tous', 'Homme', 'Femme'];
const ageRangeOptions: AgeRange[] = ['Tous', '18-25', '26-35', '36+'];
const availabilityOptions: AvailabilitySlot[] = [
  'Semaine - Matin', 'Semaine - Midi', 'Semaine - Soir',
  'Weekend - Matin', 'Weekend - Midi', 'Weekend - Soir'
];

// --- Composant Principal ---
export default function SwipePage() {
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // États des filtres ACTIFS
  const [selectedDistance, setSelectedDistance] = useState<number>(25);
  const [selectedLevel, setSelectedLevel] = useState<Level>('Tous');
  const [selectedGenre, setSelectedGenre] = useState<Genre>('Tous');
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange>('Tous');
  // 5. NOUVEL ÉTAT (multi-sélection)
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilitySlot[]>([]);

  // États des filtres TEMPORAIRES (dans la modale)
  const [tempDistance, setTempDistance] = useState(selectedDistance);
  const [tempLevel, setTempLevel] = useState(selectedLevel);
  const [tempGenre, setTempGenre] = useState(selectedGenre);
  const [tempAgeRange, setTempAgeRange] = useState(selectedAgeRange);
  // 6. NOUVEL ÉTAT TEMPORAIRE
  const [tempAvailability, setTempAvailability] = useState<AvailabilitySlot[]>(selectedAvailability);

  // Pile de cartes
  const [activeProfiles, setActiveProfiles] = useState<Profile[]>([]);
  const [dragState, setDragState] = useState(initialState);

  // 7. Logique de filtrage (useMemo) - MISE À JOUR
  const filteredProfiles = useMemo(() => {
    console.log(`Filtrage...`);
    
    let profiles = masterProfileList
      .filter(p => p.distanceKm <= selectedDistance);
    
    if (selectedLevel !== 'Tous') {
      profiles = profiles.filter(p => p.level === selectedLevel);
    }
    
    if (selectedGenre !== 'Tous') {
      profiles = profiles.filter(p => p.genre === selectedGenre);
    }

    if (selectedAgeRange !== 'Tous') {
      profiles = profiles.filter(p => {
        if (selectedAgeRange === '18-25') return p.age >= 18 && p.age <= 25;
        if (selectedAgeRange === '26-35') return p.age >= 26 && p.age <= 35;
        if (selectedAgeRange === '36+') return p.age >= 36;
        return true;
      });
    }

    // NOUVELLE LOGIQUE DE FILTRE (Disponibilité)
    // Si des filtres de dispo sont sélectionnés
    if (selectedAvailability.length > 0) {
      profiles = profiles.filter(profile => 
        // Garde le profil SI au moins une de ses dispos
        profile.availability.some(avail => 
          // correspond à une des dispos sélectionnées dans le filtre
          selectedAvailability.includes(avail)
        )
      );
    }
    
    return profiles;
  }, [selectedDistance, selectedLevel, selectedGenre, selectedAgeRange, selectedAvailability]); // 5 dépendances

  // Mettre à jour la pile de cartes lorsque les filtres changent
  useEffect(() => {
    setActiveProfiles(filteredProfiles);
  }, [filteredProfiles]); 

  // --- Logique d'ouverture/fermeture de la modale ---
  const openModal = () => {
    // Synchroniser tous les filtres temporaires
    setTempDistance(selectedDistance);
    setTempLevel(selectedLevel);
    setTempGenre(selectedGenre);
    setTempAgeRange(selectedAgeRange);
    setTempAvailability(selectedAvailability); // NOUVEAU
    setIsFilterModalOpen(true);
  };

  const closeModal = () => {
    setIsFilterModalOpen(false);
  };

  // 8. Appliquer les filtres de la modale
  const handleApplyFilters = () => {
    // Copier les états temporaires vers les états actifs
    setSelectedDistance(tempDistance);
    setSelectedLevel(tempLevel);
    setSelectedGenre(tempGenre);
    setSelectedAgeRange(tempAgeRange);
    setSelectedAvailability(tempAvailability); // NOUVEAU
    closeModal();
  };

  // 9. NOUVELLE FONCTION (pour gérer la multi-sélection des disponibilités)
  const handleToggleAvailability = (slot: AvailabilitySlot) => {
    setTempAvailability((prev) => 
      prev.includes(slot)
        ? prev.filter(s => s !== slot) // Si existe, le retirer
        : [...prev, slot] // Sinon, l'ajouter
    );
  };

  // --- Logique de Swipe (inchangée) ---
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    if (activeProfiles.length === 0) return;
    e.preventDefault();
    setDragState({ ...initialState, isDragging: true, startX: e.clientX });
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
      setActiveProfiles((prev) => prev.slice(1));
    }
    setDragState(initialState);
  };

  const getCardStyle = () => {
    if (!dragState.isDragging) {
      return { transform: '', transition: 'transform 0.3s ease-out' }; 
    }
    const { deltaX, deltaY } = dragState;
    const rotation = deltaX * 0.1; 
    return {
      transform: `translateX(${deltaX}px) translateY(${deltaY / 3}px) rotate(${rotation}deg)`,
      transition: "none", 
    };
  };

  // --- Rendu JSX ---

  // Rendu d'une carte (inchangé, on n'affiche pas les dispos sur la carte)
  const renderProfileCard = (profile: Profile, index: number) => {
    const isTopCard = index === 0;
    return (
      <div
        key={profile.id}
        className="swipe-card"
        style={{ 
          '--card-image-url': `url(${profile.imageUrl})`, 
          zIndex: 100 - index, 
          transform: isTopCard ? getCardStyle().transform : `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
          transition: isTopCard ? getCardStyle().transition : 'transform 0.3s ease-out',
          opacity: (1 - index * 0.1)
        }}
        onMouseDown={isTopCard ? handleDragStart : undefined}
      >
        <div className="swipe-card-info">
          <h3>{profile.name}, {profile.age}</h3>
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

  // 10. JSX pour la Modale de Filtre (Mis à jour)
  const renderFilterModal = () => {
    if (!isFilterModalOpen) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          
          <div className="modal-header">
            <h3>Filtres</h3>
            <button onClick={closeModal} className="modal-close-btn"><X size={24} /></button>
          </div>

          <div className="modal-body">
            
            {/* Filtre Distance */}
            <div className="filter-group">
              <label className="filter-label">Distance max</label>
              <div className="filter-options">
                {distanceOptions.map((distance) => (
                  <button
                    key={distance}
                    className={`filter-btn ${tempDistance === distance ? 'active' : ''}`}
                    onClick={() => setTempDistance(distance)}
                  >
                    {distance} km
                  </button>
                ))}
              </div>
            </div>
            
            {/* Filtre Niveau Partenaire */}
            <div className="filter-group">
              <label className="filter-label">Niveau du partenaire</label>
              <div className="filter-options">
                {levelOptions.map((level) => (
                  <button
                    key={level}
                    className={`filter-btn ${tempLevel === level ? 'active' : ''}`}
                    onClick={() => setTempLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre Genre */}
            <div className="filter-group">
              <label className="filter-label">Genre</label>
              <div className="filter-options">
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    className={`filter-btn ${tempGenre === genre ? 'active' : ''}`}
                    onClick={() => setTempGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre Tranche d'âge */}
            <div className="filter-group">
              <label className="filter-label">Tranche d'âge</label>
              <div className="filter-options">
                {ageRangeOptions.map((range) => (
                  <button
                    key={range}
                    className={`filter-btn ${tempAgeRange === range ? 'active' : ''}`}
                    onClick={() => setTempAgeRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* NOUVEAU: Filtre Disponibilités */}
            <div className="filter-group">
              <label className="filter-label">Disponibilités préférées</label>
              <div className="filter-options">
                {availabilityOptions.map((slot) => (
                  <button
                    key={slot}
                    // La classe active est basée sur l'inclusion dans l'array
                    className={`filter-btn ${tempAvailability.includes(slot) ? 'active' : ''}`}
                    // On utilise le nouveau handler
                    onClick={() => handleToggleAvailability(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="modal-footer">
            <button className="modal-apply-btn" onClick={handleApplyFilters}>
              Appliquer
            </button>
          </div>

        </div>
      </div>
    );
  };

  // --- Rendu de la Page ---
  return (
    <div 
      className="swipe-page-container"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd} 
    >
      {renderFilterModal()}
      
      <div className="page-header">
        <button className="open-filters-btn" onClick={openModal}>
          <SlidersHorizontal size={20} />
          <span>Filtres</span>
        </button>
      </div>
      
      <div className="swipe-card-deck">
        {activeProfiles.length > 0 ? (
          activeProfiles.map(renderProfileCard).reverse()
        ) : (
          <div className="no-profiles-message">
            Aucun profil ne correspond à vos filtres.
          </div>
        )}
      </div>
    </div>
  );
}