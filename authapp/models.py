from django.conf import settings
from django.db import models
# L'import User est manquant, mais settings.AUTH_USER_MODEL est utilisé
# from django.contrib.auth.models import User # Décommenter si besoin


class Profile(models.Model):
    LEVEL_CHOICES = [
        ("beginner", "Débutant"),
        ("intermediate", "Intermédiaire"),
        ("advanced", "Avancé"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    level = models.CharField(max_length=32, choices=LEVEL_CHOICES, blank=True, default="")
    location_city = models.CharField(max_length=128, blank=True, default="")
    goals = models.TextField(blank=True, default="")
    availability_week = models.BooleanField(default=False)
    availability_weekend = models.BooleanField(default=False)
    # Performances
    distances = models.CharField(max_length=128, blank=True, default="")  # ex: "5k,10k,semi"
    speed_kmh = models.FloatField(blank=True, null=True)  # vitesse moyenne

    def completion_info(self):
        required = {
            "level": bool(self.level),
            "location_city": bool(self.location_city),
            "goals": bool(self.goals),
            "availability": bool(self.availability_week or self.availability_weekend),
        }
        total = len(required)
        done = sum(1 for v in required.values() if v)
        percent = int(done * 100 / total)
        missing = [k for k, v in required.items() if not v]
        return {"percent": percent, "missing": missing}

    def __str__(self):
        return f"Profile<{self.user_id}>"

# --- MODÈLES AJOUTÉS ---

class Report(models.Model):
    """
    Modèle pour un signalement.
    (Basé sur votre fichier views.py et test_reports.py)
    """
    REASON_CHOICES = [
        ("spam", "Spam"),
        ("harassment", "Harcèlement"),
        ("fake", "Faux profil"),
        ("other", "Autre"),
    ]
    
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="sent_reports", on_delete=models.CASCADE)
    # Le nom 'reported_user' est déduit de votre vue 'report_user' existante
    reported_user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="received_reports", on_delete=models.CASCADE)
    
    reason = models.CharField(max_length=50, choices=REASON_CHOICES, default="other")
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Un utilisateur ne peut signaler le même utilisateur qu'une seule fois
        unique_together = ('reporter', 'reported_user')

    def __str__(self):
        return f"Report by {self.reporter.username} on {self.reported_user.username}"

class Block(models.Model):
    """ 
    Enregistre un utilisateur (blocker) qui en bloque un autre (blocked).
    """
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="blocking_users", on_delete=models.CASCADE)
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="blocked_by_users", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # S'assure qu'un utilisateur ne peut pas bloquer la même personne deux fois
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"