#!/usr/bin/env python3
"""Synchronize portfolio documentation and validate monorepo integrity."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote, urlsplit


SUBSYSTEM_NAME = re.compile(r"^(?:mvp|service|app|web)-")
IGNORED_DIRECTORIES = {
    ".angular",
    ".git",
    ".next",
    ".pytest_cache",
    ".tmp.driveupload",
    ".venv",
    ".vscode",
    "__pycache__",
    "build",
    "cache",
    "coverage",
    "dist",
    "node_modules",
    "target",
    "venv",
    "vendor",
}
PORT_PATTERNS = (
    re.compile(r"(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})", re.IGNORECASE),
    re.compile(
        r"--port(?:=|\s+)(\d{2,5})"
        r"|\b(?:PORT|API_PORT|FRONTEND_PORT|VITE_PORT)\s*=\s*(\d{2,5})"
        r"|[\"']?(?:port|frontend_port|api_port)[\"']?\s*:\s*(\d{2,5})"
        r"|\bport\s*[:=]\s*(\d{2,5})"
        r"|\.listen\(\s*(\d{2,5})",
        re.IGNORECASE,
    ),
)
MARKDOWN_LINK = re.compile(
    r"!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\s*\)"
)
HTML_LINK = re.compile(r"""(?:href|src)\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
HEADING = re.compile(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$")
REQUIREMENT = re.compile(r"^\s*([A-Za-z0-9_.-]+)(?:\[[^\]]+\])?\s*(.*)$")
PINNED_VERSION = re.compile(r"(?<![<>=!])={2,3}\s*([A-Za-z0-9_.+-]+)")
SEMANTIC_VERSION = re.compile(
    r"(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)"
    r"(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)"
    r"(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?"
    r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?"
)
IGNORED_MARKDOWN_DIRECTORIES = IGNORED_DIRECTORIES | {"_", "sueltos"}


@dataclass(frozen=True)
class Subsystem:
    name: str
    version: str
    has_readme: bool
    version_files: tuple[str, ...]
    readme_files: tuple[str, ...]
    directories: tuple[str, ...]
    recursive_directories: tuple[str, ...]
    file_count: int
    markdown_count: int
    path: Path


@dataclass(frozen=True)
class Finding:
    category: str
    location: str
    detail: str


class DuplicateJSONKey(ValueError):
    pass


def _json_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateJSONKey(f"clave JSON duplicada: {key}")
        result[key] = value
    return result


def _walk_files(directory: Path):
    for current, child_directories, filenames in os.walk(directory, followlinks=False):
        child_directories[:] = sorted(
            name for name in child_directories if name not in IGNORED_DIRECTORIES
        )
        base = Path(current)
        for filename in sorted(filenames):
            yield base / filename


def _walk_directories(directory: Path) -> tuple[str, ...]:
    found: list[str] = []
    for current, child_directories, _ in os.walk(directory, followlinks=False):
        child_directories[:] = sorted(
            name for name in child_directories if name not in IGNORED_DIRECTORIES
        )
        base = Path(current)
        for name in child_directories:
            found.append((base / name).relative_to(directory).as_posix())
    return tuple(sorted(found))


def discover_subsystems(root: Path) -> list[Subsystem]:
    subsystems: list[Subsystem] = []
    for directory in sorted(root.iterdir(), key=lambda item: item.name.casefold()):
        if not directory.is_dir() or not SUBSYSTEM_NAME.match(directory.name):
            continue

        files = list(_walk_files(directory))
        version_paths = tuple(
            path.relative_to(directory).as_posix()
            for path in files
            if path.name == "VERSION"
        )
        readme_paths = tuple(
            path.relative_to(directory).as_posix()
            for path in files
            if path.name == "README.md"
        )
        root_version = directory / "VERSION"
        version_path = root_version if root_version.is_file() else (
            directory / version_paths[0] if len(version_paths) == 1 else None
        )
        version = version_path.read_text(encoding="utf-8").strip() if version_path else ""
        markdown_count = sum(path.suffix.casefold() == ".md" for path in files)
        top_level_directories = tuple(
            sorted(
                child.name
                for child in directory.iterdir()
                if child.is_dir() and child.name not in IGNORED_DIRECTORIES
            )
        )
        subsystems.append(
            Subsystem(
                name=directory.name,
                version=version or "Sin definir",
                has_readme=bool(readme_paths),
                version_files=version_paths,
                readme_files=readme_paths,
                directories=top_level_directories,
                recursive_directories=_walk_directories(directory),
                file_count=len(files),
                markdown_count=markdown_count,
                path=directory,
            )
        )
    return subsystems


def _escape_cell(value: str) -> str:
    return value.replace("|", r"\|").replace("\n", " ")


def render_matrix(subsystems: list[Subsystem]) -> str:
    lines = [
        "| Subsistema | Versión | README | Directorios principales | Markdown |",
        "|---|---|---|---|---:|",
    ]
    for subsystem in subsystems:
        directories = ", ".join(f"`{name}/`" for name in subsystem.directories) or "—"
        lines.append(
            "| `{name}` | `{version}` | {readme} | {directories} | {markdown} |".format(
                name=_escape_cell(subsystem.name),
                version=_escape_cell(subsystem.version),
                readme="Disponible" if subsystem.has_readme else "Falta",
                directories=directories,
                markdown=subsystem.markdown_count,
            )
        )
    return "\n".join(lines)


def update_matrix(document: str, matrix: str) -> str:
    section = re.compile(
        r"(?ms)^(## Matriz de soluciones\s*\n).*?(?=^## |\Z)"
    )
    match = section.search(document)
    if not match:
        raise ValueError("No se encontró la sección '## Matriz de soluciones'.")
    replacement = f"{match.group(1).strip()}\n\n{matrix}\n\n"
    return document[: match.start()] + replacement + document[match.end() :]


def _markdown_files(root: Path) -> list[Path]:
    markdown_files = []
    for current, child_directories, filenames in os.walk(root, followlinks=False):
        child_directories[:] = sorted(
            name
            for name in child_directories
            if name not in IGNORED_MARKDOWN_DIRECTORIES
            and not (Path(current) == root and name == "portfolio")
        )
        base = Path(current)
        markdown_files.extend(
            base / filename for filename in filenames if Path(filename).suffix.casefold() == ".md"
        )
    return sorted(markdown_files, key=lambda path: path.as_posix().casefold())


def _without_code_blocks(text: str) -> str:
    visible_lines = []
    fence_character = None
    fence_length = 0
    for line in text.splitlines():
        marker = re.match(r"^\s*(`{3,}|~{3,})", line)
        if marker:
            fence = marker.group(1)
            if fence_character is None:
                fence_character = fence[0]
                fence_length = len(fence)
            elif fence[0] == fence_character and len(fence) >= fence_length:
                fence_character = None
                fence_length = 0
            continue
        if fence_character is None:
            visible_lines.append(line)
    return "\n".join(visible_lines)


def _heading_anchors(text: str) -> set[str]:
    anchors: set[str] = set()
    counts: defaultdict[str, int] = defaultdict(int)
    for line in text.splitlines():
        explicit_ids = re.findall(r"""<(?:a|h[1-6])\b[^>]*\bid=["']([^"']+)""", line, re.I)
        anchors.update(explicit_ids)
        match = HEADING.match(line)
        if not match:
            continue
        heading = re.sub(r"`([^`]*)`", r"\1", match.group(1))
        heading = re.sub(r"<[^>]+>", "", heading)
        heading = unicodedata.normalize("NFKC", heading).casefold()
        slug = "".join(
            character
            for character in heading
            if character.isalnum() or character in " -_"
        )
        slug = re.sub(r"\s+", "-", slug.strip()).replace("_", "-")
        occurrence = counts[slug]
        counts[slug] += 1
        anchors.add(slug if occurrence == 0 else f"{slug}-{occurrence}")
    return anchors


def _link_targets(text: str) -> list[str]:
    text = _without_code_blocks(text)
    targets = [
        first or second
        for first, second in MARKDOWN_LINK.findall(text)
    ]
    targets.extend(HTML_LINK.findall(text))
    return targets


def validate_links(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    markdown_files = _markdown_files(root)
    anchor_cache: dict[Path, set[str]] = {}

    for source in markdown_files:
        source_text = source.read_text(encoding="utf-8", errors="replace")
        source_relative = source.relative_to(root).as_posix()
        for target in _link_targets(source_text):
            target = unquote(target.strip())
            parsed = urlsplit(target)
            if parsed.scheme or target.startswith("//"):
                continue

            raw_path = parsed.path.replace("\\", "/")
            if raw_path.startswith("/"):
                destination = root / raw_path.lstrip("/")
            elif raw_path:
                destination = source.parent / raw_path
            else:
                destination = source

            archive_root = Path(os.path.abspath(root / "portfolio"))
            if Path(os.path.abspath(destination)).is_relative_to(archive_root):
                continue

            try:
                resolved = destination.resolve()
                resolved.relative_to(root.resolve())
            except (OSError, ValueError):
                findings.append(
                    Finding("Enlace roto", source_relative, f"destino fuera del monorepo: {target}")
                )
                continue

            fragment_file = resolved
            exists = resolved.exists()
            if exists and resolved.is_dir():
                candidates = (
                    resolved / "README.md",
                    resolved / "readme.md",
                    resolved / "index.md",
                    resolved / "index.html",
                )
                fragment_file = next((path for path in candidates if path.is_file()), resolved)
            if not exists:
                findings.append(
                    Finding("Enlace roto", source_relative, f"no existe: {target}")
                )
                continue

            fragment = unquote(parsed.fragment)
            if fragment and fragment_file.suffix.casefold() == ".md":
                if fragment_file not in anchor_cache:
                    content = fragment_file.read_text(encoding="utf-8", errors="replace")
                    anchor_cache[fragment_file] = _heading_anchors(content)
                if fragment not in anchor_cache[fragment_file]:
                    findings.append(
                        Finding(
                            "Ancla rota",
                            source_relative,
                            f"no existe '#{fragment}' en {fragment_file.relative_to(root).as_posix()}",
                        )
                    )
    return findings


def _extract_ports(text: str) -> set[int]:
    ports: set[int] = set()
    url_matches = PORT_PATTERNS[0].findall(text)
    ports.update(int(value) for value in url_matches if 0 < int(value) <= 65535)
    for match in PORT_PATTERNS[1].finditer(text):
        for value in match.groups():
            if value and 0 < int(value) <= 65535:
                ports.add(int(value))
    return ports


def validate_ports(
    subsystems: list[Subsystem], root: Path | None = None
) -> list[Finding]:
    assigned: defaultdict[int, set[str]] = defaultdict(set)
    findings: list[Finding] = []
    for subsystem in subsystems:
        for path in _walk_files(subsystem.path):
            if path.name.casefold() == "package-lock.json":
                continue
            if path.name.casefold() == "services.json":
                continue
            filename = path.name.casefold()
            is_port_source = (
                filename in {"readme.md", "package.json", "config.py", "main.py", "server.py"}
                or filename.startswith((".env", "vite.config", "docker-compose", "compose"))
                or filename in {"services.json", "settings.py"}
            )
            if not is_port_source:
                continue
            try:
                content = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for port in _extract_ports(content):
                assigned[port].add(subsystem.name)

    monitor_config = next(
        (
            subsystem.path / "config" / "services.json"
            for subsystem in subsystems
            if subsystem.name == "service-devops-monitor"
        ),
        None,
    )
    if monitor_config and monitor_config.is_file():
        try:
            services = json.loads(monitor_config.read_text(encoding="utf-8"))
            if not isinstance(services, list):
                raise ValueError("la raíz de services.json debe ser una lista")
            known_subsystems = {subsystem.name for subsystem in subsystems}
            for service in services:
                if not isinstance(service, dict):
                    raise ValueError("cada servicio de services.json debe ser un objeto")
                owner = service.get("directory")
                if owner not in known_subsystems:
                    findings.append(
                        Finding(
                            "Configuración de puertos inválida",
                            "service-devops-monitor/config/services.json",
                            f"directorio de subsistema inexistente: {owner}",
                        )
                    )
                    continue
                for key in ("api_port", "frontend_port"):
                    port = service.get(key)
                    if isinstance(port, int) and not isinstance(port, bool) and 0 < port <= 65535:
                        assigned[port].add(owner)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            findings.append(
                Finding(
                    "Configuración de puertos inválida",
                    "service-devops-monitor/config/services.json",
                    str(error),
                )
            )

    landing_root = root / "landings" if root else None
    if landing_root and landing_root.is_dir():
        for landing in sorted(landing_root.iterdir(), key=lambda item: item.name.casefold()):
            if not landing.is_dir():
                continue
            manifest_path = landing / "package.json"
            if not manifest_path.is_file():
                continue
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as error:
                findings.append(
                    Finding(
                        "Configuración de puertos inválida",
                        manifest_path.relative_to(root).as_posix(),
                        str(error),
                    )
                )
                continue

            scripts = manifest.get("scripts") if isinstance(manifest, dict) else None
            for script_name in ("dev", "preview"):
                command = scripts.get(script_name) if isinstance(scripts, dict) else None
                ports = _extract_ports(command) if isinstance(command, str) else set()
                if len(ports) != 1 or "--strictPort" not in command:
                    findings.append(
                        Finding(
                            "Puerto de frontend no fijado",
                            manifest_path.relative_to(root).as_posix(),
                            f"el script {script_name} debe declarar un único --port y --strictPort",
                        )
                    )
                for port in ports:
                    assigned[port].add(f"landings/{landing.name}")

    findings.extend(
        Finding(
            "Colisión de puerto",
            f"puerto {port}",
            "asignado a " + ", ".join(sorted(names)),
        )
        for port, names in sorted(assigned.items())
        if len(names) > 1
    )
    return findings


def validate_versions(subsystems: list[Subsystem]) -> list[Finding]:
    findings: list[Finding] = []
    for subsystem in subsystems:
        if subsystem.version_files != ("VERSION",):
            findings.append(
                Finding(
                    "Versión inválida",
                    subsystem.name,
                    "debe existir un único archivo VERSION en la raíz del subsistema",
                )
            )
            continue

        contents = (subsystem.path / "VERSION").read_text(encoding="utf-8")
        lines = contents.splitlines()
        if len(lines) != 1 or not SEMANTIC_VERSION.fullmatch(lines[0]):
            findings.append(
                Finding(
                    "Versión inválida",
                    f"{subsystem.name}/VERSION",
                    "debe contener una única línea SemVer válida",
                )
            )
    return findings


def _normalized_dependency(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).casefold()


def _pinned_versions(specifier: str) -> set[str]:
    return {match.group(1).casefold() for match in PINNED_VERSION.finditer(specifier)}


def validate_dependencies(subsystems: list[Subsystem]) -> list[Finding]:
    findings: list[Finding] = []
    for subsystem in subsystems:
        package_declarations: defaultdict[
            tuple[Path, str], list[tuple[str, str, Path]]
        ] = defaultdict(list)
        requirement_declarations: defaultdict[
            tuple[Path, str], list[tuple[str, Path]]
        ] = defaultdict(list)

        for path in _walk_files(subsystem.path):
            relative = path.relative_to(subsystem.path).as_posix()
            if path.name == "package.json":
                try:
                    manifest = json.loads(
                        path.read_text(encoding="utf-8"),
                        object_pairs_hook=_json_object,
                    )
                except (OSError, json.JSONDecodeError, DuplicateJSONKey) as error:
                    findings.append(
                        Finding("Configuración de dependencias inválida", relative, str(error))
                    )
                    continue
                if not isinstance(manifest, dict):
                    findings.append(
                        Finding(
                            "Configuración de dependencias inválida",
                            relative,
                            "la raíz de package.json debe ser un objeto JSON",
                        )
                    )
                    continue
                for group in (
                    "dependencies",
                    "devDependencies",
                    "optionalDependencies",
                    "peerDependencies",
                ):
                    declarations = manifest.get(group, {})
                    if not isinstance(declarations, dict):
                        continue
                    for name, specifier in declarations.items():
                        package_declarations[(path, _normalized_dependency(name))].append(
                            (group, str(specifier), path)
                        )
            elif path.name.casefold().startswith("requirements") and path.suffix.casefold() == ".txt":
                for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
                    if not line.strip() or line.lstrip().startswith(("#", "-", "http://", "https://")):
                        continue
                    match = REQUIREMENT.match(line)
                    if match:
                        requirement_declarations[
                            (path.parent, _normalized_dependency(match.group(1)))
                        ].append(
                            (match.group(2).split(";")[0].strip(), path)
                        )

        for (_, name), declarations in package_declarations.items():
            pinned = {version for _, specifier, _ in declarations for version in _pinned_versions(specifier)}
            if len(pinned) > 1:
                locations = ", ".join(
                    f"{path.relative_to(subsystem.path).as_posix()}:{group}={specifier}"
                    for group, specifier, path in declarations
                )
                findings.append(
                    Finding(
                        "Colisión de dependencias",
                        subsystem.name,
                        f"{name}: versiones fijadas incompatibles ({locations})",
                    )
                )

        for (_, name), declarations in requirement_declarations.items():
            pinned = {version for specifier, _ in declarations for version in _pinned_versions(specifier)}
            if len(pinned) > 1:
                locations = ", ".join(
                    f"{path.relative_to(subsystem.path).as_posix()}={specifier or '(sin pin)'}"
                    for specifier, path in declarations
                )
                findings.append(
                    Finding(
                        "Colisión de dependencias",
                        subsystem.name,
                        f"{name}: versiones fijadas incompatibles ({locations})",
                    )
                )
    return findings


def validate(root: Path, subsystems: list[Subsystem]) -> list[Finding]:
    return (
        validate_links(root)
        + validate_ports(subsystems, root)
        + validate_dependencies(subsystems)
        + validate_versions(subsystems)
    )


def render_report(subsystems: list[Subsystem], findings: list[Finding]) -> str:
    total_files = sum(subsystem.file_count for subsystem in subsystems)
    total_directories = sum(len(subsystem.recursive_directories) for subsystem in subsystems)
    total_markdown = sum(subsystem.markdown_count for subsystem in subsystems)
    versions = sum(bool(subsystem.version_files) for subsystem in subsystems)
    readmes = sum(subsystem.has_readme for subsystem in subsystems)
    categories = defaultdict(int)
    for finding in findings:
        categories[finding.category] += 1

    lines = [
        "# Estado del ecosistema Ideal-IT",
        "",
        "Informe generado por `service-docs-hub-automator/automate.py`.",
        "",
        "## Métricas",
        "",
        "| Métrica | Valor |",
        "|---|---:|",
        f"| Subsistemas detectados (`mvp-*`, `service-*`, `app-*`, `web-*`) | {len(subsystems)} |",
        f"| Subsistemas con `VERSION` | {versions} |",
        f"| Subsistemas con `README.md` | {readmes} |",
        f"| Directorios internos | {total_directories} |",
        f"| Archivos en subsistemas | {total_files} |",
        f"| Documentos Markdown en subsistemas | {total_markdown} |",
        f"| Hallazgos de integridad | {len(findings)} |",
        "",
        "## Inventario",
        "",
        "| Subsistema | Versión | Archivo(s) VERSION | README(s) | Directorios principales | Archivos | Markdown |",
        "|---|---|---|---|---|---:|---:|",
    ]
    for subsystem in subsystems:
        versions_found = ", ".join(f"`{path}`" for path in subsystem.version_files) or "Falta"
        readmes_found = ", ".join(
            f"[`{path}`](../{subsystem.name}/{path})" for path in subsystem.readme_files
        ) or "Falta"
        directories = ", ".join(f"`{name}/`" for name in subsystem.directories) or "—"
        lines.append(
            f"| `{subsystem.name}` | `{subsystem.version}` | {versions_found} | "
            f"{readmes_found} | {directories} | {subsystem.file_count} | "
            f"{subsystem.markdown_count} |"
        )

    lines.extend(["", "## Estructura recursiva", ""])
    for subsystem in subsystems:
        tree = ", ".join(f"`{path}/`" for path in subsystem.recursive_directories) or "Sin subdirectorios"
        lines.append(f"- **`{subsystem.name}/`**: {tree}.")

    lines.extend(["", "## Integridad", ""])
    if not findings:
        lines.append(
            "Sin enlaces rotos, colisiones de puertos, conflictos de dependencias "
            "ni errores de versión detectados."
        )
    else:
        lines.extend(
            [
                f"Hallazgos por categoría: "
                + ", ".join(f"{category}: {count}" for category, count in sorted(categories.items()))
                + ".",
                "",
                "| Tipo | Ubicación | Detalle |",
                "|---|---|---|",
            ]
        )
        for finding in findings:
            lines.append(
                f"| {finding.category} | `{_escape_cell(finding.location)}` | "
                f"{_escape_cell(finding.detail)} |"
            )
    lines.append("")
    return "\n".join(lines)


def _desired_outputs(
    root: Path,
    subsystems: list[Subsystem],
    findings: list[Finding],
) -> dict[Path, str]:
    matrix = render_matrix(subsystems)
    outputs: dict[Path, str] = {}
    for hub in (root / "PORTFOLIO_HUB.md", root / "ideal-it-portfolio" / "PORTFOLIO_HUB.md"):
        if not hub.is_file():
            raise FileNotFoundError(f"No se encontró el hub requerido: {hub}")
        outputs[hub] = update_matrix(hub.read_text(encoding="utf-8"), matrix)
    outputs[root / "docs" / "ECOSYSTEM_STATUS.md"] = render_report(subsystems, findings)
    return outputs


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="no escribe archivos; falla si la documentación está desactualizada o hay hallazgos",
    )
    arguments = parser.parse_args(argv)
    root = Path(__file__).resolve().parent.parent

    try:
        subsystems = discover_subsystems(root)
        findings = validate(root, subsystems)
        outputs = _desired_outputs(root, subsystems, findings)
    except (OSError, ValueError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 2

    stale = []
    if arguments.check:
        stale = [path for path, content in outputs.items() if not path.is_file() or path.read_text(encoding="utf-8") != content]
    else:
        for path, content in outputs.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")

    for path in stale:
        print(f"DESACTUALIZADO: {path.relative_to(root).as_posix()}")
    for finding in findings:
        print(f"{finding.category}: {finding.location}: {finding.detail}")

    if not arguments.check:
        print(f"Documentación sincronizada para {len(subsystems)} subsistemas.")
    return 1 if stale or findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
