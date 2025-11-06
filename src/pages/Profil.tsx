import React, { useMemo, useRef } from 'react'; // Ajout de 'useRef'
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
  Camera // Ajout de l'icône Camera
} from 'lucide-react';

// --- Interface et Données de Test ---

interface UserProfile {
  profilePicture: string | null; // NOUVEAU: pour l'URL de la photo
  nom: string;
  prenom: string;
  age: number | null;
  genre: string | null;
  performance: string[];
  // On peut ajouter d'autres champs ici
  ville?: string;
  poids?: number; // kg
  taille?: number; // cm
}

// Données de test (INCOMPLET)
const mockProfileIncomplet: UserProfile = {
  profilePicture: null, // NOUVEAU
  nom: "Dupont",
  prenom: "", // Champ incomplet
  age: 32,
  genre: null, // Champ incomplet
  performance: ["10km en 45min", "5km en 20min"],
  ville: "Lyon",
  poids: 75,
  taille: undefined, // Champ incomplet
};

// Données de test pour un profil COMPLET
const mockProfileComplet: UserProfile = {
  profilePicture: 'https://placehold.co/100x100/EBF8FF/3B82F6?text=AM', // NOUVEAU: Un placeholder
  nom: "Martin",
  prenom: "Alice",
  age: 28,
  genre: "Féminin",
  performance: ["Semi-marathon en 1h45"],
  ville: "Paris",
  poids: 62,
  taille: 168,
};

// Liste des champs à vérifier (incluant la photo)
const PROFILE_FIELDS_TO_CHECK: (keyof UserProfile)[] = [
  'profilePicture', // NOUVEAU
  'nom', 
  'prenom', 
  'age', 
  'genre',
  'ville',
  'poids',
  'taille'
];

// --- Composant Principal ---

export default function ProfilPage() {
  
  // On initialise avec le profil incomplet
  const [profile, setProfile] = React.useState<UserProfile>(mockProfileIncomplet);

  // état pour savoir quel profil on teste
  const [isTestingComplet, setIsTestingComplet] = React.useState(false);
  
  // NOUVEAU: Référence pour l'input de fichier caché
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcule le statut de complétion du profil
  const completionStatus = useMemo(() => {
    let completedCount = 0;
    const missingFields: string[] = [];

    PROFILE_FIELDS_TO_CHECK.forEach(key => {
      const value = profile[key];
      // Vérifie si la valeur est "truthy" (pas null, undefined, "", 0)
      if (value !== null && value !== undefined && value !== "") {
        completedCount++;
      } else {
        // Capitaliser le nom du champ pour l'affichage
        let fieldName = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === 'profilePicture') fieldName = 'Photo de profil'; // Nom plus joli
        missingFields.push(fieldName);
      }
    });

    const totalFields = PROFILE_FIELDS_TO_CHECK.length;
    const percentage = Math.round((completedCount / totalFields) * 100);
    
    return {
      percentage,
      missingFields,
      isComplete: missingFields.length === 0
    };
  }, [profile]);


  // Fonction de placeholder pour la modification
  const handleEdit = (field: keyof UserProfile) => {
    // Pour l'instant, on affiche juste un message dans la console.
    console.log(`Demande de modification pour le champ : ${field}`);
  };

  // Fonction pour basculer les données de test
  const handleToggleTestData = () => {
    if (isTestingComplet) {
      setProfile(mockProfileIncomplet);
      setIsTestingComplet(false);
    } else {
      setProfile(mockProfileComplet);
      setIsTestingComplet(true);
    }
  };

  // NOUVEAU: Ouvre la boîte de dialogue de fichier
  const handlePictureClick = () => {
    fileInputRef.current?.click();
  };

  // NOUVEAU: Gère le fichier sélectionné
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return; // Pas de fichier sélectionné
    }

    // Crée une URL locale temporaire pour l'aperçu de l'image
    const newPictureUrl = URL.createObjectURL(file);
    
    // Met à jour l'état du profil avec la nouvelle URL de l'image
    setProfile(prevProfile => ({
      ...prevProfile,
      profilePicture: newPictureUrl
    }));

    // Ici, vous ajouteriez la logique pour uploader le `file`
    // vers votre backend (Django)
    console.log("Fichier sélectionné, prêt pour l'upload:", file.name);
  };


  // Un composant interne pour afficher joliment une info
  const InfoItem: React.FC<{
    icon: React.ElementType,
    label: string,
    value: string | number | null | undefined,
    fieldKey: keyof UserProfile, // Savoir quel champ on édite
    onEditClick: (field: keyof UserProfile) => void // La fonction à appeler
  }> = ({ icon: Icon, label, value, fieldKey, onEditClick }) => (
    // Ajout de "group" pour permettre au bouton d'apparaître au survol de la ligne
    <div className="flex items-center justify-between py-3 border-b border-gray-200 group">
      <div className="flex items-center text-gray-600">
        <Icon className="w-5 h-5 mr-3 text-blue-500" />
        <span className="font-medium">{label}</span>
      </div>

      {/* On ajoute un conteneur flex pour la valeur ET le bouton */}
      <div className="flex items-center space-x-2">
        <span className={`text-gray-900 ${!value ? 'text-gray-400 italic' : ''}`}>
          {value || 'Non renseigné'}
        </span>
        {/* Le bouton "stylo" */}
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
      {/* NOUVEAU: Input de fichier caché */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" // Rendre l'input invisible
        accept="image/png, image/jpeg" // N'accepter que les images
        data-testid="file-input" // Utile pour les tests
      />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Mon Profil</h1>

        {/* --- Bouton de Test --- */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <h3 className="font-semibold text-blue-800">Zone de Test</h3>
          <p className="text-sm text-blue-700 mb-3">
            Cliquez sur ce bouton pour basculer entre un profil complet et un profil incomplet.
            Cela permet de *tester visuellement* la logique de complétion (US#6).
          </p>
          <button
            onClick={handleToggleTestData}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300"
          >
            {isTestingComplet ? "Tester le Profil Incomplet" : "Tester le Profil Complet"}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- Carte Principale (Profil) --- */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-6">
              
              {/* --- MODIFICATION: Avatar cliquable --- */}
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
                {/* Overlay pour l'icône "modifier" */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-300">
                  <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              {/* --- FIN MODIFICATION --- */}

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.prenom || 'Utilisateur'} {profile.nom || ''}
                </h2>
                <p className="text-gray-600">{profile.ville || 'Localisation inconnue'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <InfoItem icon={User} label="Nom" value={profile.nom} fieldKey="nom" onEditClick={handleEdit} />
              <InfoItem icon={User} label="Prénom" value={profile.prenom} fieldKey="prenom" onEditClick={handleEdit} />
              <InfoItem icon={Calendar} label="Âge" value={profile.age ? `${profile.age} ans` : null} fieldKey="age" onEditClick={handleEdit} />
              <InfoItem icon={Info} label="Genre" value={profile.genre} fieldKey="genre" onEditClick={handleEdit} />
              <InfoItem icon={MapPin} label="Ville" value={profile.ville} fieldKey="ville" onEditClick={handleEdit} />
              <InfoItem icon={Target} label="Poids" value={profile.poids ? `${profile.poids} kg` : null} fieldKey="poids" onEditClick={handleEdit} />
              <InfoItem icon={Target} label="Taille" value={profile.taille ? `${profile.taille} cm` : null} fieldKey="taille" onEditClick={handleEdit} />
            </div>
          </div>

          {/* --- Colonne de Droite (Complétion & Performances) --- */}
          <div className="space-y-6">

            {/* --- Carte de Complétion (US#6) --- */}
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

            {/* --- Carte des Performances --- */}
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
      </div>
    </div>
  );
}