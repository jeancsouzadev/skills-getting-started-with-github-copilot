import urllib.parse

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def client():
    client = TestClient(app_module.app)
    yield client


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # expect some known activities present
    assert "Chess Club" in data


def test_signup_and_reflect(client):
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure email not present initially
    pre = client.get("/activities").json()
    assert email not in pre[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{urllib.parse.quote(activity)}/signup", params={"email": email})
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Check it appears in activities
    post = client.get("/activities").json()
    assert email in post[activity]["participants"]


def test_double_signup_returns_400(client):
    activity = "Chess Club"
    email = "testuser@example.com"

    resp = client.post(f"/activities/{urllib.parse.quote(activity)}/signup", params={"email": email})
    assert resp.status_code == 400


def test_unregister_participant(client):
    activity = "Chess Club"
    email = "testuser@example.com"

    resp = client.delete(f"/activities/{urllib.parse.quote(activity)}/participants", params={"email": email})
    assert resp.status_code == 200

    # Ensure removed
    post = client.get("/activities").json()
    assert email not in post[activity]["participants"]


def test_unregister_missing_returns_404(client):
    activity = "Chess Club"
    email = "nonexistent@example.com"

    resp = client.delete(f"/activities/{urllib.parse.quote(activity)}/participants", params={"email": email})
    assert resp.status_code == 404
