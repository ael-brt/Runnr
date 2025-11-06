import React, { useMemo } from 'react';
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
  Pencil // L'icône du stylo
} from 'lucide-react';

// --- Interface et Données de Test ---

interface UserProfile {
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
// Renommé pour plus de clarté
const mockProfileIncomplet: UserProfile = {
  nom: "Dupont",
  prenom: "", // Champ incomplet
  age: 32,
  genre: null, // Champ incomplet
  performance: ["10km en 45min", "5km en 20min"],
  ville: "Lyon",
  poids: 75,
  taille: undefined, // Champ incomplet
};

// --- AJOUT : Données de test pour un profil COMPLET ---
const mockProfileComplet: UserProfile = {
  nom: "Martin",
  prenom: "Alice",
  age: 28,
  genre: "Féminin",
  performance: ["Semi-marathon en 1h45"],
  ville: "Paris",
  poids: 62,
  taille: 168,
};

// Liste des champs que nous voulons suivre pour la complétion
const PROFILE_FIELDS_TO_CHECK: (keyof UserProfile)[] = [
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

  // --- AJOUT : état pour savoir quel profil on teste ---
  const [isTestingComplet, setIsTestingComplet] = React.useState(false);

  // Calcule le statut de complétion du profil
  // useMemo évite de recalculer à chaque rendu, sauf si 'profile' change
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
        missingFields.push(key.charAt(0).toUpperCase() + key.slice(1));
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
    // Plus tard, cela pourra ouvrir un modal ou un champ d'édition.
    console.log(`Demande de modification pour le champ : ${field}`);
  };

  // --- AJOUT : Fonction pour basculer les données de test ---
  const handleToggleTestData = () => {
    if (isTestingComplet) {
      setProfile(mockProfileIncomplet);
      setIsTestingComplet(false);
    } else {
      setProfile(mockProfileComplet);
      setIsTestingComplet(true);
    }
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Mon Profil</h1>

        {/* --- AJOUT : Bouton de Test --- */}
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
        {/* --- FIN AJOUT --- */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- Carte Principale (Profil) --- */}
          <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mr-6 border-4 border-white shadow-md">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.prenom || 'Utilisateur'} {profile.nom || ''}
                </h2>
                <p className="text-gray-600">{profile.ville || 'Localisation inconnue'}</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* On passe les props 'fieldKey' et 'onEditClick' --- */}
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