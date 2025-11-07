from django.conf import settings
from django.db import models
from django.utils import timezone # AJOUT

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

# --- AJOUT POUR LA US #11 ---
class DailyLikeUsage(models.Model):
    """
    Suit l'utilisation quotidienne des 'likes' (limite de 4).
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="like_usage")
    like_count = models.PositiveIntegerField(default=0)
    last_like_date = models.DateField(default=timezone.now)

    def _reset_if_needed(self):
        """ Réinitialise le compteur si la date est passée. """
        today = timezone.now().date()
        if self.last_like_date < today:
            self.like_count = 0
            self.last_like_date = today

    def can_like(self, limit: int) -> bool:
        """ Vérifie si l'utilisateur peut liker (limite incluse). """
        self._reset_if_needed()
        return self.like_count < limit

    def increment(self, limit: int):
        """ Incrémente le compteur s'il est sous la limite. """
        self._reset_if_needed()
        if self.like_count < limit:
            self.like_count += 1
            self.save()