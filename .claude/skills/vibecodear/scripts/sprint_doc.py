"""Gestiona la documentación de Sprints en <proyecto>/.vibecodear/sprints/.

Uso:
  python sprint_doc.py new  [RUTA_PROYECTO] --objective "Objetivo medible"
  python sprint_doc.py list [RUTA_PROYECTO]

`new` crea sprint-NN.md (siguiente número) desde assets/sprint-template.md y
actualiza el índice .vibecodear/README.md. `list` muestra cada Sprint con su estado.
Código de salida: 0 = ok, 2 = entrada inválida.
"""
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

TEMPLATE = Path(__file__).resolve().parent.parent / "assets" / "sprint-template.md"


def sprints_of(folder):
    return sorted(folder.glob("sprint-[0-9][0-9].md"))


def status_of(path):
    m = re.search(r"\*\*Estado final:\*\*\s*(.+)", path.read_text(encoding="utf-8"))
    return m.group(1).strip() if m else "?"


def objective_of(path):
    m = re.search(r"\*\*Objetivo:\*\*\s*(.+)", path.read_text(encoding="utf-8"))
    return m.group(1).strip() if m else "?"


def write_index(base, folder):
    lines = ["# Vibecodear — Historial de Sprints", "",
             "| Sprint | Objetivo | Estado |", "| --- | --- | --- |"]
    for s in sprints_of(folder):
        lines.append(f"| [{s.stem}](sprints/{s.name}) | {objective_of(s)} | {status_of(s)} |")
    (base / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["new", "list"])
    ap.add_argument("project", nargs="?", default=".")
    ap.add_argument("--objective")
    args = ap.parse_args()

    root = Path(args.project).resolve()
    if not root.is_dir():
        print(json.dumps({"ok": False, "error": f"Ruta inválida: {root}"}, ensure_ascii=False, indent=2))
        return 2
    base = root / ".vibecodear"
    folder = base / "sprints"

    if args.action == "list":
        items = [{"file": s.name, "objective": objective_of(s), "status": status_of(s)}
                 for s in sprints_of(folder)]
        print(json.dumps({"ok": True, "sprints": items}, ensure_ascii=False, indent=2))
        return 0

    if not args.objective or not args.objective.strip():
        print(json.dumps({"ok": False, "error": "Falta --objective: todo Sprint necesita un objetivo medible"},
                         ensure_ascii=False, indent=2))
        return 2
    folder.mkdir(parents=True, exist_ok=True)
    number = len(sprints_of(folder)) + 1
    target = folder / f"sprint-{number:02d}.md"
    previous = f"sprint-{number - 1:02d}.md" if number > 1 else "— (primer Sprint)"
    content = (TEMPLATE.read_text(encoding="utf-8")
               .replace("{{NUMBER}}", f"{number:02d}")
               .replace("{{DATE}}", date.today().isoformat())
               .replace("{{OBJECTIVE}}", args.objective.strip())
               .replace("{{PREVIOUS}}", previous))
    target.write_text(content, encoding="utf-8")
    write_index(base, folder)
    print(json.dumps({"ok": True, "created": str(target), "sprint": number,
                      "index": str(base / "README.md")}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
