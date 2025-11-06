from django.contrib import admin
from django.urls import path
from authapp.views import google_login, google_callback_dispatch, me, logout_view

urlpatterns = [
    path("admin/", admin.site.urls),
    # OAuth Google
    path("auth/google/login", google_login, name="google_login"),
    path("auth/google/callback", google_callback_dispatch, name="google_callback"),
    # API simples
    path("api/me", me, name="me"),
    path("api/logout", logout_view, name="logout"),
]
