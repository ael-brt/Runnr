import os, urllib.parse, json
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.views.decorators.http import require_GET
from django.conf import settings
from django.shortcuts import redirect
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import AuthCanceled
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

# FRONTEND_URL pour rediriger après login
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
User = get_user_model()

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

# ---- Facebook OAuth ----
@require_GET
def facebook_login(request):
    strategy = load_strategy(request)
    backend = load_backend(strategy=strategy, name="facebook", redirect_uri=_callback_url_fb(request))
    return HttpResponseRedirect(backend.auth_url())

def _callback_url_fb(request):
    return request.build_absolute_uri("/auth/facebook/callback")

@require_GET
def facebook_callback_dispatch(request):
    strategy = load_strategy(request)
    backend = load_backend(strategy=strategy, name="facebook", redirect_uri=_callback_url_fb(request))
    try:
        user = backend.complete()
        login(request, user)
    except AuthCanceled:
        return redirect(f"{FRONTEND_URL}/signin?error=cancelled")
    return redirect(f"{FRONTEND_URL}/dashboard")

# ---- Apple OAuth ----
@require_GET
def apple_login(request):
    strategy = load_strategy(request)
    backend = load_backend(strategy=strategy, name="apple-id", redirect_uri=_callback_url_apple(request))
    return HttpResponseRedirect(backend.auth_url())

def _callback_url_apple(request):
    return request.build_absolute_uri("/auth/apple/callback")

@require_GET
def apple_callback_dispatch(request):
    strategy = load_strategy(request)
    backend = load_backend(strategy=strategy, name="apple-id", redirect_uri=_callback_url_apple(request))
    try:
        user = backend.complete()
        login(request, user)
    except AuthCanceled:
        return redirect(f"{FRONTEND_URL}/signin?error=cancelled")
    return redirect(f"{FRONTEND_URL}/dashboard")

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({
        "id": u.id,
        "email": u.email,
        "name": u.get_full_name() or u.username,
    })

@api_view(["POST"])  # POC: pas de CSRF exigé
@permission_classes([AllowAny])
@csrf_exempt
def logout_view(request):
    # Efface les cookies côté client
    resp = JsonResponse({"ok": True})
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    logout(request)
    return resp

# ---- Email/password sign-up & login ----
@api_view(["POST"])  # POC: CSRF exempt pour simplicité front
@permission_classes([AllowAny])
@csrf_exempt
def register_email(request):
    data = json.loads(request.body or b"{}")
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()
    if not email or not password:
        return Response({"error": "email et mot de passe requis"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"error": "email déjà utilisé"}, status=400)
    user = User.objects.create_user(username=email, email=email, password=password)
    if name:
        # Tenter de découper prénom/nom simplement
        parts = name.split(" ", 1)
        if len(parts) == 2:
            user.first_name, user.last_name = parts[0], parts[1]
        else:
            user.first_name = name
        user.save()
    login(request, user)
    return Response({"ok": True, "email": user.email})

@api_view(["POST"])  # POC: CSRF exempt
@permission_classes([AllowAny])
@csrf_exempt
def login_email(request):
    data = json.loads(request.body or b"{}")
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = authenticate(request, username=email, password=password)
    if not user:
        return Response({"error": "identifiants invalides"}, status=400)
    login(request, user)
    return Response({"ok": True})

# ---- Password reset ----
@api_view(["POST"])  # POC: CSRF exempt
@permission_classes([AllowAny])
@csrf_exempt
def request_password_reset(request):
    data = json.loads(request.body or b"{}")
    email = (data.get("email") or "").strip().lower()
    if not email:
        return Response({"error": "email requis"}, status=400)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Ne pas divulguer l’existence des comptes
        return Response({"ok": True})
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{FRONTEND_URL}/reset/confirm?uid={uid}&token={token}"
    # En dev, l'email part vers la console
    from django.core.mail import send_mail
    send_mail(
        subject="Réinitialisation de mot de passe",
        message=f"Clique sur ce lien pour réinitialiser ton mot de passe: {reset_url}",
        from_email=None,
        recipient_list=[email],
        fail_silently=True,
    )
    return Response({"ok": True})

@api_view(["POST"])  # POC: CSRF exempt
@permission_classes([AllowAny])
@csrf_exempt
def reset_password_confirm(request):
    data = json.loads(request.body or b"{}")
    uidb64 = data.get("uid") or ""
    token = data.get("token") or ""
    new_password = data.get("password") or ""
    if not (uidb64 and token and new_password):
        return Response({"error": "données incomplètes"}, status=400)
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({"error": "lien invalide"}, status=400)
    if not default_token_generator.check_token(user, token):
        return Response({"error": "token invalide ou expiré"}, status=400)
    user.set_password(new_password)
    user.save()
    return Response({"ok": True})
