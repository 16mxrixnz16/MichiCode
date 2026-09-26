"""Inspecciona un proyecto y devuelve un resumen JSON determinista.

Uso: python inspect_project.py [RUTA_PROYECTO]

Nunca imprime valores de variables de entorno ni secretos: solo nombres y archivo:línea.
Código de salida: 0 = ok, 2 = ruta inválida.
"""
import json
import re
import shutil
import socket
import subprocess
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "dist", "build", ".next", "__pycache__",
             ".venv", "venv", ".terraform", ".vibecodear", "coverage", ".claude"}
TEXT_EXT = {".js", ".jsx", ".ts", ".tsx", ".py", ".yml", ".yaml", ".json", ".tf",
            ".env", ".sh", ".md", ".mjs", ".cjs", ".go", ".rs", ".java", ".kt", ".cs",
            ".php", ".rb", ".properties", ".toml"}
TOOLS = ["git", "node", "npm", "python", "go", "cargo", "java", "mvn", "gradle", "dotnet",
         "php", "ruby", "docker", "terraform", "aws", "mongosh"]
COMMON_PORTS = [80, 3000, 5000, 5173, 8000, 8080, 27017]

ENV_REF = [
    re.compile(r"process\.env\.([A-Z][A-Z0-9_]+)"),
    re.compile(r"os\.environ(?:\.get)?\(\s*['\"]([A-Z][A-Z0-9_]+)"),
    re.compile(r"os\.getenv\(\s*['\"]([A-Z][A-Z0-9_]+)"),
    re.compile(r"os\.environ\[\s*['\"]([A-Z][A-Z0-9_]+)"),
    re.compile(r"(?:os\.Getenv|System\.getenv|getenv|ENV\[)\(?\s*['\"]([A-Z][A-Z0-9_]+)"),
    re.compile(r"\$\{([A-Z][A-Z0-9_]+)\}"),
]
SECRET = re.compile(
    r"(password|passwd|secret|api[_-]?key|token|mongodb(\+srv)?://[^:\s]+:[^@\s]+@)",
    re.IGNORECASE)
TEST_FILE = re.compile(
    r"(\.test\.|\.spec\.|^tests?\.[a-z]+$|^test_.*\.py$|_test\.(py|go)$|Tests?\.(java|cs|kt)$|_spec\.rb$)")
TEST_DIRS = {"test", "tests", "__tests__", "spec"}
# Archivo marcador -> tecnología. Permite reconocer proyectos que no son Node.
MARKERS = {
    "requirements.txt": "python", "pyproject.toml": "python", "Pipfile": "python",
    "manage.py": "django", "go.mod": "go", "Cargo.toml": "rust", "pom.xml": "java-maven",
    "build.gradle": "java-gradle", "build.gradle.kts": "java-gradle", "composer.json": "php",
    "Gemfile": "ruby", "pubspec.yaml": "flutter", "Makefile": "make",
}


def walk(root):
    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        yield path


def read(path):
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""


def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def tool_version(name):
    exe = shutil.which(name)
    if not exe:
        return None
    try:
        out = subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=10)
        return (out.stdout or out.stderr).strip().splitlines()[0]
    except Exception:
        return "instalado (versión desconocida)"


def docker_running():
    if not shutil.which("docker"):
        return False
    try:
        return subprocess.run(["docker", "info"], capture_output=True, timeout=15).returncode == 0
    except Exception:
        return False


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    if not root.is_dir():
        print(json.dumps({"ok": False, "error": f"La ruta no existe o no es una carpeta: {root}"},
                         ensure_ascii=False, indent=2))
        return 2

    files = [p for p in walk(root) if p.is_file()]
    rel = lambda p: p.relative_to(root).as_posix()
    stack, packages, compose, tests, warnings = set(), [], [], [], []
    env_referenced, env_defined, secrets = set(), set(), []

    for p in files:
        name = p.name
        if name == "package.json":
            try:
                data = json.loads(read(p))
            except json.JSONDecodeError:
                warnings.append(f"package.json inválido: {rel(p)}")
                continue
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            for key, label in [("react", "react"), ("next", "nextjs"), ("vue", "vue"),
                               ("vite", "vite"), ("express", "express"),
                               ("mongoose", "mongodb"), ("mongodb", "mongodb"),
                               ("typescript", "typescript")]:
                if key in deps:
                    stack.add(label)
            stack.add("node")
            has_modules = (p.parent / "node_modules").is_dir()
            packages.append({
                "path": rel(p.parent) or ".",
                "scripts": sorted(data.get("scripts", {}).keys()),
                "dependencies": len(deps),
                "node_modules_installed": has_modules,
            })
            if deps and not has_modules:
                warnings.append(f"Dependencias no instaladas en {rel(p.parent) or '.'} (falta node_modules)")
        elif name in MARKERS:
            stack.add(MARKERS[name])
        elif p.suffix in (".csproj", ".sln"):
            stack.add("dotnet")
        elif name == "Dockerfile":
            stack.add("docker")
        elif re.match(r"(docker-)?compose.*\.ya?ml$", name):
            stack.add("docker-compose")
            text = read(p)
            services = re.findall(r"^  ([a-zA-Z0-9_-]+):\s*$", text, re.MULTILINE)
            ports = [int(h) for h in re.findall(r"['\"]?(\d+):\d+['\"]?", text)]
            compose.append({"file": rel(p), "services": services, "host_ports": sorted(set(ports))})
            if "mongo" in text:
                stack.add("mongodb")
        elif p.suffix == ".tf":
            stack.add("terraform")
            if 'provider "aws"' in read(p):
                stack.add("aws")
        elif ".github/workflows" in rel(p):
            stack.add("github-actions")

        in_test_dir = any(part in TEST_DIRS for part in p.relative_to(root).parts[:-1])
        if TEST_FILE.search(name) or (in_test_dir and p.suffix in TEXT_EXT - {".md", ".json"}):
            tests.append(rel(p))
        if name.startswith(".env"):
            for line in read(p).splitlines():
                m = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
                if m:
                    env_defined.add(m.group(1))
        elif p.suffix in TEXT_EXT or name == "Dockerfile":
            text = read(p)
            for rx in ENV_REF:
                env_referenced.update(rx.findall(text))
            if p.suffix != ".md" and name != "package-lock.json":
                for i, line in enumerate(text.splitlines(), 1):
                    uri_with_password = re.search(r"://[^:/\s$]+:[^@\s$]+@", line)
                    assigned = (SECRET.search(line) and re.search(r"[:=]\s*['\"]?[^\s'\"$]{6,}", line)
                                and "${" not in line and "secrets." not in line
                                and "process.env" not in line)
                    if uri_with_password or assigned:
                        secrets.append(f"{rel(p)}:{i}")

    env_missing = sorted(env_referenced - env_defined)
    if env_missing:
        warnings.append(f"{len(env_missing)} variables de entorno usadas sin definir en ningún .env")
    if not tests:
        warnings.append("No se encontraron archivos de test")
    if secrets:
        warnings.append(f"{len(secrets)} posibles secretos escritos en el código")

    tools = {t: tool_version(t) for t in TOOLS}
    ports = sorted({p for c in compose for p in c["host_ports"]} | set(COMMON_PORTS))
    busy = [p for p in ports if port_in_use(p)]
    if busy:
        warnings.append(f"Puertos ocupados: {busy}")
    needed_tools = {"node": "node", "python": "python", "go": "go", "rust": "cargo",
                    "java-maven": "mvn", "dotnet": "dotnet", "php": "php", "ruby": "ruby",
                    "docker": "docker", "terraform": "terraform", "aws": "aws"}
    for tech, tool in needed_tools.items():
        if tech in stack and not tools.get(tool):
            warnings.append(f"El proyecto usa {tech} pero '{tool}' no está instalado")

    result = {
        "ok": True,
        "project": str(root),
        "stack": sorted(stack) or ["unknown"],
        "files_scanned": len(files),
        "packages": packages,
        "compose": compose,
        "infra": {
            "terraform_files": [rel(p) for p in files if p.suffix == ".tf"],
            "ci_workflows": [rel(p) for p in files if ".github/workflows" in rel(p)],
        },
        "tests": {"count": len(tests), "files": tests[:30]},
        "env": {"referenced": sorted(env_referenced), "defined": sorted(env_defined),
                "missing": env_missing},
        "possible_secrets": secrets[:30],
        "tools": tools,
        "docker_daemon_running": docker_running() if tools.get("docker") else False,
        "ports_in_use": busy,
        "warnings": warnings,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
