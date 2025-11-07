import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

# Limite à 4, comme demandé
DAILY_LIKE_LIMIT = 4

@pytest.mark.django_db
def test_swipe_like_api_limit():
    client = APIClient()
    user_A = User.objects.create_user("user_a@example.com", "pass")
    user_B = User.objects.create_user("user_b@example.com", "pass")
    
    # Authentifie user_A
    client.force_authenticate(user=user_A)
    
    # Cette URL n'existe pas encore
    url = f"/api/swipe/like/{user_B.id}"
    
    # 1. Effectuer 4 likes (doivent réussir)
    for i in range(DAILY_LIKE_LIMIT):
        response = client.post(url)
        assert response.status_code == 200, f"Le like #{i+1} a échoué"
        assert response.json()["ok"] is True
    
    # 2. Le 5ème like doit échouer (429 Too Many Requests)
    response = client.post(url)
    assert response.status_code == 429
    assert response.json()["error"] == "Limite de likes quotidiens atteinte"
    
    # 3. Vérifier le compteur en BDD
    user_A.refresh_from_db()
    assert user_A.like_usage.like_count == DAILY_LIKE_LIMIT