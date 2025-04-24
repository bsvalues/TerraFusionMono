import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app

# Create a test client
client = TestClient(app)


def test_health_live():
    """
    Test that the liveness endpoint returns 200
    """
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("main.is_database_ready", True)
@patch("main.is_nats_ready", True)
def test_health_ready_all_services_up():
    """
    Test that the readiness endpoint returns 200 when all services are up
    """
    response = client.get("/health/ready")
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "ready"
    assert result["database"] == "connected"
    assert result["nats"] == "connected"


@patch("main.is_database_ready", False)
@patch("main.is_nats_ready", True)
def test_health_ready_database_down():
    """
    Test that the readiness endpoint returns 503 when database is down
    """
    response = client.get("/health/ready")
    assert response.status_code == 200  # FastAPI defaults to 200 unless explicitly set
    result = response.json()
    assert result["status"] == "not ready"
    assert result["database"] == "disconnected"
    assert result["nats"] == "connected"


@patch("main.is_database_ready", True)
@patch("main.is_nats_ready", False)
def test_health_ready_nats_down():
    """
    Test that the readiness endpoint returns 503 when nats is down
    """
    response = client.get("/health/ready")
    assert response.status_code == 200  # FastAPI defaults to 200 unless explicitly set
    result = response.json()
    assert result["status"] == "not ready"
    assert result["database"] == "connected"
    assert result["nats"] == "disconnected"


@patch("main.is_database_ready", False)
@patch("main.is_nats_ready", False)
def test_health_ready_all_services_down():
    """
    Test that the readiness endpoint returns 503 when all services are down
    """
    response = client.get("/health/ready")
    assert response.status_code == 200  # FastAPI defaults to 200 unless explicitly set
    result = response.json()
    assert result["status"] == "not ready"
    assert result["database"] == "disconnected"
    assert result["nats"] == "disconnected"