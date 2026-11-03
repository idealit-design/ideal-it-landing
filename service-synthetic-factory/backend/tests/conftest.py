from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from main import create_app


@pytest.fixture
def client(tmp_path: Path):
    app = create_app(
        database_path=tmp_path / "factory-test.db",
        assets_dir=tmp_path / "generated",
    )
    with TestClient(app) as test_client:
        yield test_client
