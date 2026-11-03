import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import automate


class AutomatorTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_discovers_nested_subsystem_structure_and_metadata(self):
        subsystem = self.root / "mvp-example"
        (subsystem / "backend" / "app").mkdir(parents=True)
        (subsystem / "VERSION").write_text("1.2.3\n", encoding="utf-8")
        (subsystem / "README.md").write_text("# Example\n", encoding="utf-8")
        (subsystem / "backend" / "app" / "README.md").write_text(
            "# Nested docs\n", encoding="utf-8"
        )

        result = automate.discover_subsystems(self.root)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].version, "1.2.3")
        self.assertEqual(result[0].directories, ("backend",))
        self.assertIn("backend/app", result[0].recursive_directories)
        self.assertEqual(result[0].markdown_count, 2)

    def test_discovers_web_subsystems(self):
        subsystem = self.root / "web-example"
        subsystem.mkdir()
        (subsystem / "VERSION").write_text("1.2.3\n", encoding="utf-8")

        result = automate.discover_subsystems(self.root)

        self.assertEqual([item.name for item in result], ["web-example"])

    def test_requires_single_line_semver_at_subsystem_root(self):
        valid = self.root / "mvp-valid"
        invalid = self.root / "web-invalid"
        missing = self.root / "service-missing"
        for subsystem in (valid, invalid, missing):
            subsystem.mkdir()
        (valid / "VERSION").write_text("1.2.3\n", encoding="utf-8")
        (invalid / "VERSION").write_text("v1.2.3\n", encoding="utf-8")

        findings = automate.validate_versions(automate.discover_subsystems(self.root))

        self.assertEqual(len(findings), 2)
        self.assertEqual({finding.category for finding in findings}, {"Versión inválida"})

    def test_updates_only_matrix_section(self):
        source = (
            "# Hub\n\n## Matriz de soluciones\n\nold table\n\n"
            "## More information\n\npreserved\n"
        )
        result = automate.update_matrix(source, "| New | Row |\n|---|---|")

        self.assertIn("| New | Row |", result)
        self.assertNotIn("old table", result)
        self.assertIn("## More information\n\npreserved", result)
        self.assertEqual(automate.update_matrix(result, "| New | Row |\n|---|---|"), result)

    def test_detects_missing_internal_target_and_anchor(self):
        (self.root / "docs").mkdir()
        source = self.root / "docs" / "guide.md"
        source.write_text(
            "# Present\n\n[missing](other.md) [bad anchor](#absent)\n",
            encoding="utf-8",
        )

        findings = automate.validate_links(self.root)

        self.assertEqual(len(findings), 2)
        self.assertEqual({finding.category for finding in findings}, {"Enlace roto", "Ancla rota"})

    def test_excludes_portfolio_archive_from_link_audit(self):
        archive = self.root / "portfolio"
        archive.mkdir()
        (archive / "historical.md").write_text(
            "[missing](does-not-exist.md)\n", encoding="utf-8"
        )
        (self.root / "README.md").write_text(
            "[historical](portfolio/does-not-exist.md)\n", encoding="utf-8"
        )

        self.assertEqual(automate.validate_links(self.root), [])

    def test_extracts_configured_ports_and_ignores_fenced_examples(self):
        self.assertEqual(automate._extract_ports("PORT=8042"), {8042})
        markdown = "Visible [link](present.md)\n```md\n[example](missing.md)\n"
        self.assertEqual(automate._link_targets(markdown), ["present.md"])

    def test_attributes_monitor_port_config_to_monitored_subsystems(self):
        first = self.root / "mvp-one"
        second = self.root / "app-two"
        monitor = self.root / "service-devops-monitor" / "config"
        first.mkdir()
        second.mkdir()
        monitor.mkdir(parents=True)
        (monitor / "services.json").write_text(
            json.dumps(
                [
                    {"directory": "mvp-one", "frontend_port": 5173},
                    {"directory": "app-two", "frontend_port": 5173},
                ]
            ),
            encoding="utf-8",
        )

        findings = automate.validate_ports(automate.discover_subsystems(self.root))

        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].category, "Colisión de puerto")
        self.assertEqual(findings[0].detail, "asignado a app-two, mvp-one")

    def test_detects_landing_port_collisions_and_unpinned_commands(self):
        landings = self.root / "landings"
        for name in ("one", "two"):
            directory = landings / name
            directory.mkdir(parents=True)
            (directory / "package.json").write_text(
                json.dumps(
                    {
                        "scripts": {
                            "dev": "vite --host 127.0.0.1 --port 5180 --strictPort",
                            "preview": "vite preview --host 127.0.0.1 --port 5180 --strictPort",
                        }
                    }
                ),
                encoding="utf-8",
            )
        unpinned = landings / "unpinned"
        unpinned.mkdir()
        (unpinned / "package.json").write_text(
            json.dumps(
                {"scripts": {"dev": "vite --host 127.0.0.1", "preview": "vite preview"}}
            ),
            encoding="utf-8",
        )

        findings = automate.validate_ports([], self.root)

        self.assertEqual(
            sum(finding.category == "Colisión de puerto" for finding in findings),
            1,
        )
        self.assertEqual(
            sum(finding.category == "Puerto de frontend no fijado" for finding in findings),
            2,
        )

    def test_detects_port_and_dependency_collisions(self):
        first = self.root / "mvp-one"
        second = self.root / "app-two"
        (first / "frontend").mkdir(parents=True)
        (first / "backend").mkdir()
        (second / "backend").mkdir(parents=True)
        (first / "README.md").write_text(
            "Frontend: http://localhost:5173\n", encoding="utf-8"
        )
        (second / "README.md").write_text(
            "Frontend: http://127.0.0.1:5173\n", encoding="utf-8"
        )
        (first / "frontend" / "package.json").write_text(
            json.dumps(
                {
                    "dependencies": {"react": "==18.2.0"},
                    "devDependencies": {"react": "==19.0.0"},
                }
            ),
            encoding="utf-8",
        )
        (first / "backend" / "requirements.txt").write_text(
            "requests==2.31.0\n", encoding="utf-8"
        )
        (first / "backend" / "requirements-dev.txt").write_text(
            "requests==2.32.0\n", encoding="utf-8"
        )

        subsystems = automate.discover_subsystems(self.root)
        port_findings = automate.validate_ports(subsystems)
        dependency_findings = automate.validate_dependencies(subsystems)

        self.assertEqual(len(port_findings), 1)
        self.assertIn("5173", port_findings[0].location)
        self.assertEqual(len(dependency_findings), 2)
        self.assertTrue(all(item.category == "Colisión de dependencias" for item in dependency_findings))


if __name__ == "__main__":
    unittest.main()
