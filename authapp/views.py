import os, urllib.parse, json
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth import login, logout
from django.views.decorators.http import require_GET
from django.conf import settings
from django.shortcuts import redirect
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import AuthCanceled
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# FRONTEND_URL pour rediriger après login
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

@require_GET
def google_login(request):
    """
    Démarre l’OAuth Google (Authorization Code Flow côté serveur).
    """
    strategy = load_strategy(request)
    backend = load_backend(strategy=strategy, name="google-oauth2", redirect_uri=_callback_url(request))
    # Redirection vers Google
    authorization_url = backend.auth_url()
    return HttpResponseRedirect(authorization_url)

def _callback_url(request):
    base = request.build_absolute_uri("/auth/google/callback")
    return base

@require_GET
def google_callback_dispatch(request):
    """
    Callback Google -> crée/connexion de l'utilisateur, émet des JWT,
    les met en cookies httpOnly et redirige vers le frontend.
    """
    strategy = load_strategy(request)
    backend = load_backend(strategy=strategy, name="google-oauth2", redirect_uri=_callback_url(request))

    try:
        user = backend.complete()  # échange code -> token, récupère le profil, crée/associe User
        login(request, user)      # session Django (facultatif si tu n’utilises que JWT)
    except AuthCanceled:
        # L’utilisateur a annulé → retour propre au front
        return redirect(f"{FRONTEND_URL}/signin?error=cancelled")

    # Générer les JWT
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)

    # Déposer en cookies httpOnly (recommandé)
    response = redirect(f"{FRONTEND_URL}/dashboard")
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=False,  # True en prod (HTTPS)
        samesite="Lax",
        max_age=60*60,
    )
    response.set_cookie(
        key="refresh_token",
        value=str(refresh),
        httponly=True,
        secure=False,  # True en prod
        samesite="Lax",
        max_age=60*60*24*7,
    )
    return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({
        "id": u.id,
        "email": u.email,
        "name": u.get_full_name() or u.username,
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    # Efface les cookies côté client
    resp = JsonResponse({"ok": True})
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    logout(request)
    return resp
