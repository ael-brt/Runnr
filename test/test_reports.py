import pytest
import json
from django.contrib.auth import get_user_model
from authapp.models import Report  # ÉCHOUERA: Report n'existe pas encore

User = get_user_model()

@pytest.fixture
def setup_users(db):
    """Crée deux utilisateurs pour les tests."""
    user1 = User.objects.create_user(username="reporter@test.com", email="reporter@test.com", password="password123")
    user2 = User.objects.create_user(username="reported@test.com", email="reported@test.com", password="password123")
    return user1, user2

@pytest.mark.django_db
def test_create_report_success(client, setup_users):
    """
    TEST (Rouge): Un utilisateur authentifié doit pouvoir signaler un autre utilisateur.
    """
    reporter, reported_user = setup_users
    
    # Authentifier le 'reporter'
    client.login(username="reporter@test.com", password="password123")
    
    report_data = {
        "reported_user_id": reported_user.id,
        "reason": "spam",
        "details": "Il envoie de la publicité."
    }
    
    # ÉCHOUERA: /api/report n'existe pas encore
    response = client.post("/api/report", data=json.dumps(report_data), content_type="application/json")
    
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    
    # ÉCHOUERA: Report.objects n'existe pas
    assert Report.objects.count() == 1
    report = Report.objects.first()
    assert report.reporter == reporter
    assert report.reported_user == reported_user
    assert report.reason == "spam"
    assert report.details == "Il envoie de la publicité."

@pytest.mark.django_db
def test_report_fails_if_not_authenticated(client, setup_users):
    """
    TEST (Rouge): Un utilisateur non authentifié ne doit pas pouvoir signaler.
    """
    _, reported_user = setup_users
    report_data = {"reported_user_id": reported_user.id, "reason": "spam"}
    
    response = client.post("/api/report", data=json.dumps(report_data), content_type="application/json")
    
    # ÉCHOUERA (404 au lieu de 403)
    assert response.status_code in [401, 403]
    assert Report.objects.count() == 0

@pytest.mark.django_db
def test_report_fails_if_missing_data(client, setup_users):
    """
    TEST (Rouge): L'API doit valider que 'reported_user_id' est présent.
    """
    reporter, _ = setup_users
    client.login(username="reporter@test.com", password="password123")
    
    report_data = {"reason": "spam"} # Pas de reported_user_id
    
    response = client.post("/api/report", data=json.dumps(report_data), content_type="application/json")
    
    assert response.status_code == 400
    assert "reported_user_id requis" in response.json().get("error", "")
    assert Report.objects.count() == 0

@pytest.mark.django_db
def test_user_cannot_report_self(client, setup_users):
    """
    TEST (Rouge): Un utilisateur ne doit pas pouvoir se signaler lui-même.
    """
    reporter, _ = setup_users
    client.login(username="reporter@test.com", password="password123")
    
    report_data = {
        "reported_user_id": reporter.id, # Se signale lui-même
        "reason": "spam"
    }
    
    response = client.post("/api/report", data=json.dumps(report_data), content_type="application/json")
    
    assert response.status_code == 400
    assert "Vous ne pouvez pas vous signaler vous-même" in response.json().get("error", "")
    assert Report.objects.count() == 0