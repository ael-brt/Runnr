import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from freezegun import freeze_time
# Ceci échouera car DailyLikeUsage n'existe pas encore
from .models import DailyLikeUsage 

User = get_user_model()

# Limite à 4, comme demandé
DAILY_LIMIT = 4

@pytest.mark.django_db
def test_like_limitation_logic():
    user = User.objects.create_user("testeur@example.com", "pass")
    
    # Simule le 1er Avril 2024
    with freeze_time("2024-04-01"):
        # L'import ou cette ligne échouera
        usage, created = DailyLikeUsage.objects.get_or_create(user=user)
        assert created is True
        assert usage.like_count == 0
        assert usage.last_like_date == timezone.now().date()

        # 1. L'utilisateur peut liker 4 fois
        for i in range(DAILY_LIMIT):
            assert usage.can_like(limit=DAILY_LIMIT) is True
            usage.increment(limit=DAILY_LIMIT)
            assert usage.like_count == i + 1
            
        # 2. Le 5ème like est bloqué
        assert usage.like_count == DAILY_LIMIT
        assert usage.can_like(limit=DAILY_LIMIT) is False
        
        # Tenter d'incrémenter ne change rien
        usage.increment(limit=DAILY_LIMIT)
        assert usage.like_count == DAILY_LIMIT

    # Simule le lendemain
    with freeze_time("2024-04-02"):
        # 3. Le compteur est réinitialisé
        assert usage.can_like(limit=DAILY_LIMIT) is True
        assert usage.like_count == 0 # Le check a réinitialisé
        
        usage.increment(limit=DAILY_LIMIT)
        assert usage.like_count == 1