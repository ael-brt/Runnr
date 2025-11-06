from django.contrib import admin
from django.urls import path
from authapp.views import (
    google_login, google_callback_dispatch,
    facebook_login, facebook_callback_dispatch,
    apple_login, apple_callback_dispatch,
    me, logout_view,
    register_email, login_email,
    request_password_reset, reset_password_confirm,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # OAuth Google
    path("auth/google/login", google_login, name="google_login"),
    path("auth/google/callback", google_callback_dispatch, name="google_callback"),
    path("auth/facebook/login", facebook_login, name="facebook_login"),
    path("auth/facebook/callback", facebook_callback_dispatch, name="facebook_callback"),
    path("auth/apple/login", apple_login, name="apple_login"),
    path("auth/apple/callback", apple_callback_dispatch, name="apple_callback"),
    # API simples
    path("api/register", register_email, name="register_email"),
    path("api/login", login_email, name="login_email"),
    path("api/me", me, name="me"),
    path("api/logout", logout_view, name="logout"),
    path("api/request-password-reset", request_password_reset, name="request_password_reset"),
    path("api/reset-password-confirm", reset_password_confirm, name="reset_password_confirm"),
]
