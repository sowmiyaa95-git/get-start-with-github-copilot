from fastapi.testclient import TestClient
import pytest

from src import app as myapp


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset in-memory activities to a known state before each test
    myapp.activities = {
        "Test Club": {
            "description": "A club for testing",
            "schedule": "Now",
            "max_participants": 5,
            "participants": [],
        }
    }
    yield


client = TestClient(myapp.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert "Test Club" in data
    assert data["Test Club"]["participants"] == []


def test_signup_and_remove_participant():
    email = "alice@test.edu"

    # Sign up
    resp = client.post(f"/activities/Test%20Club/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Participant should appear in GET
    resp = client.get("/activities")
    assert email in resp.json()["Test Club"]["participants"]

    # Remove participant
    resp = client.delete(f"/activities/Test%20Club/participants?email={email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Participant should be gone
    resp = client.get("/activities")
    assert email not in resp.json()["Test Club"]["participants"]


def test_duplicate_signup_returns_400():
    email = "bob@test.edu"
    resp = client.post(f"/activities/Test%20Club/signup?email={email}")
    assert resp.status_code == 200

    resp2 = client.post(f"/activities/Test%20Club/signup?email={email}")
    assert resp2.status_code == 400
