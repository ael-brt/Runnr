from django.apps import AppConfig


class AuthappConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "authapp"

    def ready(self):
        # enregistre les signaux
        from . import signals  # noqa: F401
