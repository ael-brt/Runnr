# Guide de lancement — Runnr (backend + frontend)

Ce document décrit le process de démarrage complet en local.

## Prérequis
- Python 3.10+ (`python3 --version`)
- Node.js 18+ et npm (`node -v`, `npm -v`)
- Un navigateur et un compte Google (pour tester l'OAuth)

## 1) Backend — installation et lancement

### a. Environnement virtuel et dépendances
macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
pip install -r requirements.txt
```
Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -r requirements.txt
```

### b. Variables d’environnement
Copie le modèle puis remplis tes identifiants OAuth et clés:
```bash
cp .env.example .env
```
Champs utiles:
- `DJANGO_SECRET_KEY`
- `FRONTEND_URL` (ex: `http://localhost:5173`)
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- (Optionnel) Facebook/Apple: `FACEBOOK_*`, `APPLE_*`

Dans la console Google, ajoute l’URI de redirection autorisée:
- `http://localhost:8000/auth/google/callback`

### c. Démarrer le serveur
```bash
make run            # applique les migrations + lance le serveur
# ou
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
Par défaut: http://localhost:8000

Astuce ports:
- Voir qui écoute: `make who-uses-port`
- Tuer le process: `make kill-port`
- Changer de port: `make run PORT=8001`

### d. Compte administrateur Django
```bash
source .venv/bin/activate
python manage.py createsuperuser
# puis connecte-toi sur http://localhost:8000/admin
```

## 2) Frontend — installation et lancement

### a. Installer les dépendances
```bash
npm install
```

### b. Config env Vite (URL de l’API)
Crée un fichier `.env.local` à la racine (ou exporte la variable en ligne):
```
VITE_API_BASE_URL=http://localhost:8000
```

### c. Démarrer le front
```bash
npm run dev
```
Par défaut: http://localhost:5173

### d. Tests (Vitest + Testing Library)
Installation des dépendances (si pas déjà fait):
```bash
npm install
```
Lancer les tests en mode CLI:
```bash
npm test
```
Interface UI (facultatif):
```bash
npm run test:ui
```
Configuration:
- Environnement: jsdom
- Fichier de setup: `src/test-setup.ts`

## 3) Parcours d’authentification

- Inscription e‑mail: `/signup`
- Connexion e‑mail + Google/Apple/Facebook: `/signin`
- Mot de passe oublié: `/reset` → lien console email → `/reset/confirm?uid=...&token=...`
- Déconnexion: bouton dans `/dashboard`

Notes:
- Pour le dev, l’envoi d’email utilise la console (voir logs serveur Django).
- Les endpoints auth/profil sont CSRF-exempt pour simplifier le POC. En prod, activer le CSRF côté front et retirer les `@csrf_exempt`.

## 4) Profil sportif (complétion)

- Édition: `/profile` (niveau, ville, objectifs, dispos semaine/week-end)
- Complétion affichée dans `/dashboard` tant que le profil n’est pas à 100%.

## 5) Endpoints utiles (backend)

- Auth e‑mail: `POST /api/register`, `POST /api/login`, `POST /api/logout`
- Profil courant: `GET /api/me`
- Profil sportif: `GET /api/profile`, `PATCH /api/profile/update`
- Reset mot de passe: `POST /api/request-password-reset`, `POST /api/reset-password-confirm`
- OAuth: `GET /auth/google/login` (+ callback), idem pour `/auth/facebook/login` et `/auth/apple/login` une fois configurés

## 6) Git — créer une branche et pousser, nouveau dépôt

### a. Créer une nouvelle branche et la pousser
```bash
# depuis la branche actuelle (ex: main)
git checkout -b feature/ma-fonctionnalite

# travailler, puis stage + commit
git add -A
git commit -m "feat: ma fonctionnalité"

# pousser la branche sur le remote
git push -u origin feature/ma-fonctionnalite
```

### b. Démarrer avec un nouveau dépôt (à partir de ce dossier)
```bash
# si ce projet est déjà un repo et que tu veux repartir de zéro
rm -rf .git

# initialiser un nouveau repo local
git init
git branch -M main
git add -A
git commit -m "chore: initial commit"

# créer un dépôt distant (GitHub/GitLab) puis l'ajouter comme remote
# exemple GitHub via HTTPS
git remote add origin https://github.com/<utilisateur>/<nouveau-repo>.git

# pousser la branche principale
git push -u origin main
```

Astuce:
- Configure ton identité Git si nécessaire: `git config user.name "Ton Nom"` et `git config user.email "toi@example.com"`.
- Pour SSH: ajoute ta clé publique à GitHub/GitLab et utilise `git@github.com:<utilisateur>/<repo>.git`.
