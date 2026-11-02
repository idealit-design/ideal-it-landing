import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture
def client(tmp_path, monkeypatch):
    database_path = tmp_path / "portal-ciudadano-test.db"
    monkeypatch.setenv("PORTAL_CIUDADANO_DATABASE_PATH", str(database_path))

    from main import app

    with TestClient(app) as test_client:
        yield test_client
