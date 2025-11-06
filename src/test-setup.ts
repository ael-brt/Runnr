// import 'whatwg-fetch'; // Décommentez si vous testez des appels 'fetch'
import '@testing-library/jest-dom';

// Mocker l'API URL.createObjectURL qui n'existe pas dans l'environnement de test
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => {
    // Retourne une URL factice pour les tests
    return 'blob:mock-url-for-test';
  };
}