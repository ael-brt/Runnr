import os
from datetime import timedelta
from pathlib import Path
# Ce fichier est à la racine du dépôt, donc BASE_DIR = dossier courant
BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret")
DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite
    "http://localhost:3000",  # CRA
]
CORS_ALLOW_CREDENTIALS = True

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # 3rd‑party
    "rest_framework",
    "corsheaders",
    "social_django",
    # apps
    "authapp",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

# Fichiers de configuration du projet
ROOT_URLCONF = "urls"
WSGI_APPLICATION = "wsgi.application"
ASGI_APPLICATION = "asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                # social-auth
                "social_django.context_processors.backends",
                "social_django.context_processors.login_redirect",
            ],
        },
    }
]

# Base de données SQLite par défaut
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTHENTICATION_BACKENDS = (
    "social_core.backends.google.GoogleOAuth2",
    "django.contrib.auth.backends.ModelBackend",
)

# URLs du provider Google (crée tes credentials OAuth 2.0 côté Google Cloud)
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.getenv("GOOGLE_CLIENT_ID")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Optionnel: limiter aux emails vérifiés
SOCIAL_AUTH_GOOGLE_OAUTH2_USE_UNIQUE_USER_ID = True
SOCIAL_AUTH_GOOGLE_OAUTH2_AUTH_EXTRA_ARGUMENTS = {"prompt": "select_account"}
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = ["openid", "email", "profile"]

LOGIN_REDIRECT_URL = "/auth/google/complete/dispatch"
LOGIN_URL = "/auth/google/login"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        # Utilise la session créée par login(request, user)
        "rest_framework.authentication.SessionAuthentication",
        # Optionnel: permet d'utiliser un header Authorization: Bearer
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Cookies pour renvoyer les JWT de manière sécurisée
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Autres réglages courants
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
