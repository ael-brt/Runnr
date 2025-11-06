from django.conf import settings
from django.db import models

class RunnerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    avg_pace_s_per_km = models.PositiveIntegerField(default=360)
    weekly_km = models.PositiveIntegerField(default=20)
    long_run_km = models.PositiveIntegerField(default=12)
    elevation_per_week = models.PositiveIntegerField(default=200)
    prefered_distance_km = models.PositiveIntegerField(default=10)
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return f"Profile({self.user})"
