# Environnement Python (venv) et installation

Ce guide permet à toute personne de recréer l’environnement Python localement.

## Prérequis
- Python 3.10+ installé (vérifier avec `python3 --version`)
- Accès à un terminal (macOS/Linux/WSL/PowerShell)

## Créer et activer le venv

### macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip
pip install -r requirements.txt
```

### Windows (PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip
pip install -r requirements.txt
```

Astuce: pense à ajouter `.venv/` dans `.gitignore` si ce n’est pas déjà le cas, pour ne pas versionner l’environnement virtuel.

## Variables d’environnement
Copie le fichier d’exemple et renseigne tes secrets Google OAuth:
```bash
cp .env.example .env
# Ouvre .env et remplace les valeurs par tes identifiants
```

Variables attendues:
- `DJANGO_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL` (ex: `http://localhost:5173`)

## Lancer le backend
Le dépôt contient du code Django/DRF, mais il manque encore le squelette complet d’un projet Django (ex: `manage.py`, `ROOT_URLCONF`, `DATABASES`, etc.).

Si tu veux, je peux ajouter un squelette minimal tout de suite pour que `runserver` fonctionne. Dis-moi et je l’initialise avec:
- `manage.py`
- configuration `settings` complète
- `urls.py` connecté
- base SQLite par défaut

## Lancer le frontend
Le frontend React utilise `react-router-dom`, mais il manque la toolchain (Vite/CRA). Si tu veux, je peux aussi initialiser un projet Vite (TypeScript) et brancher les fichiers `src/` existants.

