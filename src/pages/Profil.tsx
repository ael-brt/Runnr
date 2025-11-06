import React, { useMemo, useRef, useState } from 'react';
import { 
  User, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Target, 
  Info,
  ChevronRight,
  ClipboardList,
  Pencil,
  Camera,
  Image as ImageIcon,
  PlusCircle,
  FileText, 
  Flag,       
} from 'lucide-react';

// --- Interface et Données de Test ---

type ObjectifType = "Marathon" | "Semi-Marathon" | "10km" | "5km" | "Endurance" | "Vitesse" | "Perte de poids";

interface UserProfile {
  profilePicture: string | null; 
  gallery: string[];
  bio: string | null; 
  objectif: ObjectifType | null; 
  nom: string;
  prenom: string;
  age: number | null;
  genre: string | null;
  performance: string[];
  ville?: string; // Ce champ représente la commune
  poids?: number; // kg
  taille?: number; // cm
}

// Données de test (INCOMPLET)
const mockProfileIncomplet: UserProfile = {
  profilePicture: null,
  gallery: [],
  bio: null, 
  objectif: null, 
  nom: "Dupont",
  prenom: "", 
  age: 32,
  genre: null, 
  performance: ["10km en 45min", "5km en 20min"],
  ville: "Lyon", // Exemple de commune
  poids: 75,
  taille: undefined,
};

// Données de test pour un profil COMPLET
const mockProfileComplet: UserProfile = {
  profilePicture: 'https://placehold.co/100x100/EBF8FF/3B82F6?text=AM',
  gallery: [
    'https://placehold.co/400x400/E0F2FE/0C4A6E?text=Course+1',
    'https://placehold.co/400x400/E0E7FF/3730A3?text=Course+2',
  ],
  bio: "Coureur passionné lyonnais, je prépare mon premier marathon. J'aime les sorties longues le week-end et découvrir de nouveaux parcours dans la région.",
  objectif: "Marathon", 
  nom: "Martin",
  prenom: "Alice",
  age: 28,
  genre: "Féminin",
  performance: ["Semi-marathon en 1h45"],
  ville: "Paris", // Exemple de commune
  poids: 62,
  taille: 168,
};

// Liste des champs à vérifier (incluant bio et objectif)
const PROFILE_FIELDS_TO_CHECK: (keyof UserProfile)[] = [
  'profilePicture',
  'nom', 
  'prenom', 
  'age', 
  'genre',
  'ville', // Le champ 'ville' est déjà ici
  'poids',
  'taille',
  'bio', 
  'objectif' 
];

const MAX_GALLERY_PHOTOS = 5;

// --- Composant Principal ---

export default function ProfilPage() {
  
  const [profile, setProfile] = useState<UserProfile>(mockProfileIncomplet);
  const [isTestingComplet, setIsTestingComplet] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'photos'>('profil');

  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Calcule le statut de complétion du profil
  const completionStatus = useMemo(() => {
    let completedCount = 0;
    const missingFields: string[] = [];

    PROFILE_FIELDS_TO_CHECK.forEach(key => {
      const value = profile[key];
      if (value !== null && value !== undefined && value !== "") {
        completedCount++;
      } else {
        // Noms conviviaux pour la liste des champs manquants
        let fieldName = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === 'profilePicture') fieldName = 'Photo de profil';
        if (key === 'bio') fieldName = 'Biographie';
        if (key === 'objectif') fieldName = 'Objectif';
        if (key === 'ville') fieldName = 'Commune'; // MODIFIÉ: Libellé pour la complétion
        missingFields.push(fieldName);
      }
    });

    const totalFields = PROFILE_FIELDS_TO_CHECK.length;
    const percentage = Math.round((completedCount / totalFields) * 100);
    
    return { percentage, missingFields, isComplete: missingFields.length === 0 };
  }, [profile]);


  // Fonction de placeholder pour la modification
  const handleEdit = (field: keyof UserProfile) => {
    console.log(`Demande de modification pour le champ : ${field}`);
    // Si field === 'ville', vous ouvrirez un modal de recherche de commune
  };

  // Fonction pour basculer les données de test
  const handleToggleTestData = () => {
    const newProfile = isTestingComplet ? mockProfileIncomplet : mockProfileComplet;
    setProfile(newProfile);
    setIsTestingComplet(!isTestingComplet);
  };

  // Ouvre la boîte de dialogue pour la photo de profil
  const handlePictureClick = () => {
    profilePictureInputRef.current?.click();
  };

  // Gère le fichier sélectionné pour la photo de profil
  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newPictureUrl = URL.createObjectURL(file);
    setProfile(prevProfile => ({
      ...prevProfile,
      profilePicture: newPictureUrl
    }));
    console.log("Photo de profil sélectionnée:", file.name);
  };

  // Ouvre la boîte de dialogue pour la galerie
  const handleGalleryUploadClick = () => {
    if (profile.gallery.length >= MAX_GALLERY_PHOTOS) {
      alert(`Vous ne pouvez ajouter que ${MAX_GALLERY_PHOTOS} photos au maximum.`);
      return;
    }
    galleryInputRef.current?.click();
  };

  // Gère le fichier sélectionné pour la galerie
  const handleGalleryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (profile.gallery.length >= MAX_GALLERY_PHOTOS) {
      return; // Sécurité
    }

    const newPhotoUrl = URL.createObjectURL(file);
    setProfile(prevProfile => ({
      ...prevProfile,
      gallery: [...prevProfile.gallery, newPhotoUrl]
    }));
    console.log("Photo de galerie ajoutée:", file.name);

    if (event.target) {
      event.target.value = "";
    }
  };


  // Composant interne pour un item d'info
  const InfoItem: React.FC<{
    icon: React.ElementType,
    label: string,
    value: string | number | null | undefined,
    fieldKey: keyof UserProfile, 
    onEditClick: (field: keyof UserProfile) => void
  }> = ({ icon: Icon, label, value, fieldKey, onEditClick }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 group">
      <div className="flex items-center text-gray-600">
        <Icon className="w-5 h-5 mr-3 text-blue-500" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`text-gray-900 ${!value ? 'text-gray-400 italic' : ''}`}>
          {value || 'Non renseigné'}
        </span>
        <button
          onClick={() => onEditClick(fieldKey)}
          className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-opacity duration-200"
          aria-label={`Modifier ${label}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      {/* Inputs de fichiers cachés */}
      <input
        type="file"
        ref={profilePictureInputRef}
        onChange={handleProfilePictureChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleGalleryFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Mon Profil</h1>

        {/* Bouton de Test */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <h3 className="font-semibold text-blue-800">Zone de Test</h3>
          <p className="text-sm text-blue-700 mb-3">
            Cliquez sur ce bouton pour basculer entre un profil complet et un profil incomplet.
          </p>
          <button
            onClick={handleToggleTestData}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300"
          >
            {isTestingComplet ? "Tester le Profil Incomplet" : "Tester le Profil Complet"}
          </button>
        </div>
        
        {/* Barre d'onglets */}
        <div className="mb-6">
          <div className="border-b border-gray-300">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profil')}
                className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all
                  ${activeTab === 'profil'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <User className="w-5 h-5 mr-2" />
                Profil
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all
                  ${activeTab === 'photos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Photos
              </button>
            </nav>
          </div>
        </div>


        {/* Contenu conditionnel des onglets */}
        
        {/* Onglet Profil */}
        {activeTab === 'profil' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Carte Principale (Profil) */}
            <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-lg shadow-lg">
              <div className="flex items-center mb-6">
                
                <button
                  onClick={handlePictureClick}
                  className="relative w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mr-6 border-4 border-white shadow-md group transition-all"
                  aria-label="Modifier la photo de profil"
                >
                  {profile.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt="Photo de profil" 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <User className="w-10 h-10 text-blue-600" />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-300">
                    <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.prenom || 'Utilisateur'} {profile.nom || ''}
                  </h2>
                  {/* MODIFIÉ: Libellé pour le placeholder de localisation */}
                  <p className="text-gray-600">{profile.ville || 'Commune inconnue'}</p>
                </div>
              </div>
              
              {/* Bloc Bio */}
              <div className="mt-8 mb-6 group relative">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Ma Bio
                </h3>
                <p className="text-gray-600 italic text-sm leading-relaxed">
                  {profile.bio || 'Aucune biographie. Cliquez sur le stylo pour en ajouter une.'}
                </p>
                <button
                  onClick={() => handleEdit('bio')}
                  className="absolute top-0 right-0 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-opacity duration-200"
                  aria-label="Modifier la biographie"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              {/* --- Fin Bloc Bio --- */}

              <div className="space-y-2 border-t pt-4">
                <InfoItem icon={User} label="Nom" value={profile.nom} fieldKey="nom" onEditClick={handleEdit} />
                <InfoItem icon={User} label="Prénom" value={profile.prenom} fieldKey="prenom" onEditClick={handleEdit} />
                <InfoItem icon={Calendar} label="Âge" value={profile.age ? `${profile.age} ans` : null} fieldKey="age" onEditClick={handleEdit} />
                <InfoItem icon={Info} label="Genre" value={profile.genre} fieldKey="genre" onEditClick={handleEdit} />
                {/* MODIFIÉ: Libellé de "Ville" à "Commune" */}
                <InfoItem icon={MapPin} label="Commune" value={profile.ville} fieldKey="ville" onEditClick={handleEdit} />
                <InfoItem icon={Target} label="Poids" value={profile.poids ? `${profile.poids} kg` : null} fieldKey="poids" onEditClick={handleEdit} />
                <InfoItem icon={Target} label="Taille" value={profile.taille ? `${profile.taille} cm` : null} fieldKey="taille" onEditClick={handleEdit} />
                
                {/* NOUVEAU: InfoItem Objectif */}
                <InfoItem icon={Flag} label="Objectif" value={profile.objectif} fieldKey="objectif" onEditClick={handleEdit} />
              </div>
            </div>

            {/* Colonne de Droite (Complétion & Performances) */}
            <div className="space-y-6">

              {/* Carte de Complétion (US#6) */}
              <div className={`bg-white p-6 rounded-lg shadow-lg ${completionStatus.isComplete ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Complétion du Profil
                </h3>
                
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${completionStatus.isComplete ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${completionStatus.percentage}%` }}
                  />
                </div>
                <p className="text-right font-semibold text-gray-700 mb-4">{completionStatus.percentage}%</p>

                {completionStatus.isComplete ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Votre profil est complet !</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center text-red-600 mb-3">
                      <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="font-medium">Profil incomplet.</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Champs manquants :</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {completionStatus.missingFields.map(field => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Carte des Performances */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-blue-500" />
                  Performances
                </h3>
                {profile.performance.length > 0 ? (
                  <ul className="space-y-3">
                    {profile.performance.map((perf, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <ChevronRight className="w-4 h-4 mr-2 text-gray-400" />
                        {perf}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic text-sm">Aucune performance enregistrée.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Photos */}
        {activeTab === 'photos' && (
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ma Galerie Photos</h2>
            <p className="text-gray-600 mb-6">
              Ajoutez jusqu'à {MAX_GALLERY_PHOTOS} photos pour personnaliser votre profil. 
              ({profile.gallery.length} / {MAX_GALLERY_PHOTOS} ajoutées)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              
              {profile.gallery.map((photoUrl, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={photoUrl} 
                    alt={`Galerie ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg shadow-md"
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x400?text=Erreur')}
                  />
                </div>
              ))}

              {profile.gallery.length < MAX_GALLERY_PHOTOS && (
                <button
                  onClick={handleGalleryUploadClick}
                  className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg 
                             flex flex-col items-center justify-center 
                             text-gray-500 hover:bg-gray-100 hover:border-blue-500 hover:text-blue-600 
                             transition-all duration-300"
                  aria-label="Ajouter une photo à la galerie"
                >
                  <PlusCircle className="w-12 h-12" />
                  <span className="mt-2 text-sm font-medium text-center px-2">Ajouter une photo</span>
                </button>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}