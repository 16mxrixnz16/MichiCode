"""Ejecuta las verificaciones (build, test, lint, typecheck) de cada paquete Node del proyecto.

Uso: python verify.py [RUTA_PROYECTO] [--install] [--timeout SEGUNDOS]
     python verify.py [RUTA_PROYECTO] --cmd "pytest" [--cmd "go test ./..."]

Sin --cmd detecta los paquetes Node (package.json) y ejecuta sus scripts.
Con --cmd ejecuta los comandos indicados en la raíz del proyecto: sirve para cualquier stack
(Claude elige el comando según el stack detectado por inspect_project.py).
Estados por verificación: passed, failed, timeout, no_tests, missing_dependencies.
--install ejecuta `npm install` donde falte node_modules (solo con permiso del usuario).
Código de salida: 0 = nada falló, 1 = algo falló, 2 = ruta inválida.
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "dist", "build", ".claude", ".vibecodear"}
CHECKS = ["typecheck", "lint", "build", "test"]


def tail(text, n=40):
    return "\n".join((text or "").strip().splitlines()[-n:])


def run(cmd, cwd, timeout):
    env = {**os.environ, "CI": "true"}
    try:
        p = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True,
                           timeout=timeout, env=env, encoding="utf-8", errors="replace")
        return ("passed" if p.returncode == 0 else "failed"), tail(p.stdout + "\n" + p.stderr)
    except subprocess.TimeoutExpired:
        return "timeout", f"Superó {timeout}s"


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project", nargs="?", default=".")
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--cmd", action="append", default=[])
    args = ap.parse_args()

    root = Path(args.project).resolve()
    if not root.is_dir():
        print(json.dumps({"ok": False, "error": f"Ruta inválida: {root}"}, ensure_ascii=False, indent=2))
        return 2

    results = []
    if args.cmd:
        for cmd in args.cmd:
            status, out = run(cmd, root, args.timeout)
            results.append({"package": ".", "check": cmd, "status": status, "output": out})
        manifests = []
    else:
        manifests = [p for p in root.rglob("package.json")
                     if not any(part in SKIP_DIRS for part in p.relative_to(root).parts)]
    for manifest in sorted(manifests):
        pkg_dir = manifest.parent
        name = pkg_dir.relative_to(root).as_posix() or "."
        data = json.loads(manifest.read_text(encoding="utf-8"))
        scripts = data.get("scripts", {})
        has_deps = bool(data.get("dependencies") or data.get("devDependencies"))

        if has_deps and not (pkg_dir / "node_modules").is_dir():
            if args.install:
                status, out = run("npm install", pkg_dir, args.timeout)
                results.append({"package": name, "check": "install", "status": status, "output": out})
                if status != "passed":
                    continue
            else:
                results.append({"package": name, "check": "dependencies",
                                "status": "missing_dependencies",
                                "output": "Falta node_modules. Ejecuta con --install (pide permiso antes)."})
                continue

        if "test" not in scripts:
            results.append({"package": name, "check": "test", "status": "no_tests",
                            "output": "package.json no define script 'test'"})
        for check in CHECKS:
            if check in scripts:
                status, out = run(f"npm run {check}", pkg_dir, args.timeout)
                if check == "test" and status == "failed" and "No tests found" in out:
                    status = "no_tests"
                results.append({"package": name, "check": check, "status": status, "output": out})

    summary = {}
    for r in results:
        summary[r["status"]] = summary.get(r["status"], 0) + 1
    failed = any(r["status"] in ("failed", "timeout") for r in results)
    print(json.dumps({
        "ok": not failed,
        "project": str(root),
        "summary": summary,
        "results": results,
        "note": None if (manifests or args.cmd) else
        "No se encontró ningún package.json. Vuelve a ejecutar con --cmd y el comando del stack "
        "(ej. 'python -m pytest', 'go test ./...', 'mvn test', 'dotnet test', 'cargo test').",
    }, ensure_ascii=False, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
