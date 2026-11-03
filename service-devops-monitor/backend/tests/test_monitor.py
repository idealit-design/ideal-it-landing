import tempfile
import unittest
from pathlib import Path

from app.monitor import MonitoringStore, load_services


class MonitoringStoreTests(unittest.TestCase):
    def test_registry_contains_existing_mvp_directories(self) -> None:
        services = load_services()

        self.assertEqual(
            {
                "personal",
                "auditoria",
                "formularios",
                "valentin-cripto",
                "inspecciones",
                "logistica-fleet",
                "agrotech-iot",
                "visitor-pass",
            },
            {service["id"] for service in services},
        )

    def test_incidents_are_recorded_only_when_status_changes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            store = MonitoringStore(Path(temporary_directory) / "monitor.db")
            store.initialize()
            online = [{"id": "personal", "name": "Personal", "status": "online"}]

            store.record_snapshot(online, "2026-10-31T12:00:00+00:00")
            store.record_snapshot(online, "2026-10-31T12:00:15+00:00")
            store.record_snapshot(
                [{"id": "personal", "name": "Personal", "status": "offline"}],
                "2026-10-31T12:00:30+00:00",
            )

            incidents = store.get_incidents()
            self.assertEqual(["offline", "online"], [item["current_status"] for item in incidents])
            self.assertEqual("online", incidents[0]["previous_status"])
            self.assertIsNone(incidents[1]["previous_status"])

    def test_webhook_simulation_is_persisted_locally(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            store = MonitoringStore(Path(temporary_directory) / "monitor.db")
            store.initialize()

            simulation_id = store.record_webhook_simulation(
                {"event": "service_health_snapshot", "services": []},
                "2026-10-31T12:00:00+00:00",
            )

            self.assertGreater(simulation_id, 0)


if __name__ == "__main__":
    unittest.main()
