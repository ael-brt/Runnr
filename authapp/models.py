from django.conf import settings
from django.db import models


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
