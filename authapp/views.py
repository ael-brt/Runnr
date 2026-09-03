import os, urllib.parse, json
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth import login, logout, authenticate, get_user_model
# MODIFIÉ: Ajout de require_POST
from django.views.decorators.http import require_GET, require_POST
from django.conf import settings
from django.shortcuts import redirect
from social_django.utils import load_strategy, load_backend
from social_core.exceptions import AuthCanceled
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
# MODIFIÉ: Ajout de login_required
from django.contrib.auth.decorators import login_required
# MODIFIÉ: Importer le nouveau modèle Report et Block
from .models import Profile, Report, Block
from .auth import CsrfExemptSessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

# ... (toutes les vues existantes : google_login, me, profile_update, etc.) ...
# (Tout le code de google_login jusqu'à public_profile reste identique)
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
    # Ensure profile exists
    Profile.objects.get_or_create(user=u)
    info = u.profile.completion_info()
    return Response({
        "id": u.id,
        "email": u.email,
        "name": u.get_full_name() or u.username,
        "profile_completion": info["percent"],
        "profile_missing": info["missing"],
    })

@csrf_exempt
@api_view(["POST"])  # POC: pas de CSRF exigé
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([AllowAny])
def logout_view(request):
    # Efface les cookies côté client
    resp = JsonResponse({"ok": True})
    resp.delete_cookie("access_token")
    resp.delete_cookie("refresh_token")
    logout(request)
    return resp

# ---- Email/password sign-up & login ----
@csrf_exempt
@api_view(["POST"])  # POC: CSRF exempt pour simplicité front
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([AllowAny])
def register_email(request):
    data = getattr(request, "data", None) or (json.loads(request.body or b"{}"))
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()
    if not email or not password:
        return Response({"error": "email et mot de passe requis"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"error": "email déjà utilisé"}, status=400)
    try:
        user = User.objects.create_user(username=email, email=email, password=password)
    except Exception as e:
        return Response({"error": "création utilisateur impossible"}, status=500)
    if name:
        # Tenter de découper prénom/nom simplement
        parts = name.split(" ", 1)
        if len(parts) == 2:
            user.first_name, user.last_name = parts[0], parts[1]
        else:
            user.first_name = name
        user.save()
    # Crée un profil vide associé
    Profile.objects.get_or_create(user=user)
    login(request, user)
    return Response({"ok": True, "email": user.email})

@csrf_exempt
@api_view(["POST"])  # POC: CSRF exempt
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([AllowAny])
def login_email(request):
    data = getattr(request, "data", None) or (json.loads(request.body or b"{}"))
    identifier = (data.get("email") or "").strip()  # peut être email OU username
    email_lower = identifier.lower()
    password = data.get("password") or ""
    # 1) tenter comme username direct (permet la connexion avec "admin")
    user = authenticate(request, username=identifier, password=password)
    # 2) sinon, tenter par email → username
    if not user:
        try:
            u = User.objects.get(email=email_lower)
            user = authenticate(request, username=u.username, password=password)
        except User.DoesNotExist:
            user = None
    if not user:
        return Response({"error": "identifiants invalides"}, status=400)
    login(request, user)
    return Response({"ok": True})

# ---- Password reset ----
@csrf_exempt
@api_view(["POST"])  # POC: CSRF exempt
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([AllowAny])
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

@csrf_exempt
@api_view(["POST"])  # POC: CSRF exempt
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([AllowAny])
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

# ---- Profile read/update ----
@api_view(["GET"])  # infos profil + complétion
@permission_classes([IsAuthenticated])
def profile_get(request):
    p, _ = Profile.objects.get_or_create(user=request.user)
    info = p.completion_info()
    return Response({
        "level": p.level,
        "location_city": p.location_city,
        "goals": p.goals,
        "availability_week": p.availability_week,
        "availability_weekend": p.availability_weekend,
        "completion": info["percent"],
        "missing": info["missing"],
    })

@csrf_exempt
@api_view(["PATCH", "POST"])  # CSRF exempt à ce niveau (POC)
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([IsAuthenticated])
def profile_update(request):
    p, _ = Profile.objects.get_or_create(user=request.user)
    try:
        data = json.loads(request.body or b"{}")
    except Exception:
        data = {}
    # Validate level
    level = data.get("level")
    if level is not None:
        valid_levels = {c[0] for c in Profile.LEVEL_CHOICES}
        if level not in valid_levels and level != "":
            return Response({"error": "level invalide"}, status=400)
        p.level = level
    for f in ["location_city", "goals"]:
        if f in data:
            setattr(p, f, data.get(f) or "")
    if "availability_week" in data:
        p.availability_week = bool(data.get("availability_week"))
    if "availability_weekend" in data:
        p.availability_weekend = bool(data.get("availability_weekend"))
    # Performances
    if "distances" in data:
        p.distances = (data.get("distances") or "").strip()
    if "speed_kmh" in data:
        try:
            val = data.get("speed_kmh")
            p.speed_kmh = float(val) if val not in (None, "") else None
        except (TypeError, ValueError):
            return Response({"error": "speed_kmh invalide"}, status=400)
    p.save()
    info = p.completion_info()
    return Response({"ok": True, "completion": info["percent"], "missing": info["missing"]})

# ---- Public profile view ----
@api_view(["GET"])  # voir le profil d'un autre coureur
@permission_classes([IsAuthenticated])
def public_profile(request, user_id: int):
    try:
        other = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "utilisateur introuvable"}, status=404)
    p, _ = Profile.objects.get_or_create(user=other)
    data = {
        "id": other.id,
        "name": other.get_full_name() or other.username,
        "level": p.level,
        "location_city": p.location_city,
        "goals": p.goals,
        "distances": p.distances,
        "speed_kmh": p.speed_kmh,
    }
    return Response(data)

# ---- VUES MODIFIÉES/AJOUTÉES POUR SIGNALEMENT & BLOCAGE ----

@login_required # Protège la vue
@require_POST # N'accepte que les requêtes POST
@api_view(["POST"]) # Garder pour la compatibilité DRF
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([IsAuthenticated])
def api_report_user(request, user_id):
    """
    Permet à l'utilisateur authentifié de signaler un autre utilisateur
    via un paramètre dans l'URL (ex: /api/report/123/)
    REMPLACE l'ancienne vue 'report_user' qui prenait du JSON.
    """
    try:
        reported_user = User.objects.get(id=user_id)
        reporter_user = request.user

        if reporter_user.id == reported_user.id:
            return Response({"error": "Vous ne pouvez pas vous signaler vous-même"}, status=400)

        # Crée le signalement, 'get_or_create' évite les doublons
        report, created = Report.objects.get_or_create(
            reporter=reporter_user,
            reported_user=reported_user,
            defaults={'reason': 'Signalé depuis la page de swipe'}
        )

        if not created:
            return Response({"ok": True, "message": "Utilisateur déjà signalé."})
        
        return Response({"ok": True, "message": "Utilisateur signalé."})

    except User.DoesNotExist:
        return Response({"error": "Utilisateur signalé introuvable"}, status=404)
    except Exception as e:
        return Response({"error": f"Impossible de créer le signalement: {e}"}, status=500)


@login_required # Protège la vue
@require_POST # N'accepte que les requêtes POST
@api_view(["POST"]) # Garder pour la compatibilité DRF
@authentication_classes([CsrfExemptSessionAuthentication, JWTAuthentication])
@permission_classes([IsAuthenticated])
def api_block_user(request, user_id):
    """
    Permet à l'utilisateur authentifié de bloquer un autre utilisateur
    via un paramètre dans l'URL (ex: /api/block/123/)
    """
    try:
        user_to_block = User.objects.get(id=user_id)
        blocker_user = request.user

        if blocker_user.id == user_to_block.id:
            return Response({"error": "Vous ne pouvez pas vous bloquer vous-même"}, status=400)

        # Crée le blocage, 'get_or_create' évite les doublons
        block, created = Block.objects.get_or_create(
            blocker=blocker_user,
            blocked=user_to_block
        )
        
        if not created:
            return Response({"ok": True, "message": "Utilisateur déjà bloqué."})

        # TODO (RAPPEL): Supprimer les "Match" existants si vous avez un modèle Match
        # from django.db.models import Q
        # Match.objects.filter(
        #     (Q(user1=blocker_user) & Q(user2=user_to_block)) |
        #     (Q(user1=user_to_block) & Q(user2=blocker_user))
        # ).delete()

        return Response({"ok": True, "message": "Utilisateur bloqué."})
    
    except User.DoesNotExist:
        return Response({"error": "Utilisateur à bloquer introuvable"}, status=404)
    except Exception as e:
        return Response({"error": f"Impossible de bloquer l'utilisateur: {e}"}, status=500)