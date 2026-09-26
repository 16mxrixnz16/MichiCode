"""Pruebas de los scripts de Vibecodear: casos exitosos y casos de error.

Ejecutar desde la carpeta de la skill:  python -m unittest discover -s tests -v
"""
import json
import shutil
import socket
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
SCRIPTS = SKILL / "scripts"
OK_APP = SKILL / "tests" / "fixtures" / "ok-node-app"
BROKEN_APP = SKILL / "tests" / "fixtures" / "broken-app"
HAS_NODE = shutil.which("node") is not None


def run(script, *args):
    p = subprocess.run([sys.executable, str(SCRIPTS / script), *map(str, args)],
                       capture_output=True, text=True, encoding="utf-8", timeout=120)
    return p.returncode, json.loads(p.stdout)


class InspectProject(unittest.TestCase):
    def test_detects_node_project(self):
        code, out = run("inspect_project.py", OK_APP)
        self.assertEqual(code, 0)
        self.assertIn("node", out["stack"])
        self.assertEqual(out["packages"][0]["scripts"], ["start", "test"])
        self.assertIn("PORT", out["env"]["referenced"])

    def test_invalid_path(self):
        code, out = run("inspect_project.py", SKILL / "no-existe")
        self.assertEqual(code, 2)
        self.assertFalse(out["ok"])

    def test_unknown_stack(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "notas.txt").write_text("hola")
            code, out = run("inspect_project.py", tmp)
        self.assertEqual(code, 0)
        self.assertEqual(out["stack"], ["unknown"])

    def test_missing_dependencies_and_env(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "package.json").write_text('{"dependencies": {"express": "^5.0.0"}}')
            (Path(tmp) / "index.js").write_text("const url = process.env.MONGODB_URI")
            code, out = run("inspect_project.py", tmp)
        self.assertIn("MONGODB_URI", out["env"]["missing"])
        self.assertTrue(any("Dependencias no instaladas" in w for w in out["warnings"]))


class VerifyAnyStack(unittest.TestCase):
    def test_custom_command_for_non_node_project(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "requirements.txt").write_text("")
            (Path(tmp) / "test_ok.py").write_text(
                "import unittest\n\nclass T(unittest.TestCase):\n"
                "    def test_ok(self):\n        self.assertTrue(True)\n")
            code, out = run("verify.py", tmp, "--cmd", f'"{sys.executable}" -m unittest')
        self.assertEqual(code, 0, out)
        self.assertEqual(out["results"][0]["status"], "passed")

    def test_detects_python_project(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "requirements.txt").write_text("flask\n")
            (Path(tmp) / "tests").mkdir()
            (Path(tmp) / "tests" / "test_app.py").write_text("")
            code, out = run("inspect_project.py", tmp)
        self.assertIn("python", out["stack"])
        self.assertEqual(out["tests"]["count"], 1)


@unittest.skipUnless(HAS_NODE, "requiere Node.js")
class Verify(unittest.TestCase):
    def test_passing_tests(self):
        code, out = run("verify.py", OK_APP)
        self.assertEqual(code, 0)
        self.assertEqual(out["results"][0]["status"], "passed")

    def test_failing_tests(self):
        code, out = run("verify.py", BROKEN_APP)
        self.assertEqual(code, 1)
        self.assertEqual(out["results"][0]["status"], "failed")
        self.assertIn("ERR_ASSERTION", out["results"][0]["output"])

    def test_missing_dependencies_not_installed_without_permission(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "package.json").write_text(
                '{"scripts": {"test": "node -e 0"}, "dependencies": {"express": "^5.0.0"}}')
            code, out = run("verify.py", tmp)
            self.assertFalse((Path(tmp) / "node_modules").exists())
        self.assertEqual(out["results"][0]["status"], "missing_dependencies")


@unittest.skipUnless(HAS_NODE, "requiere Node.js")
class RunLocal(unittest.TestCase):
    def test_app_starts_and_responds(self):
        code, out = run("run_local.py", OK_APP, "--cmd", "node server.js",
                        "--port", 4321, "--path", "/health", "--wait", 20)
        self.assertEqual(code, 0, out)
        self.assertEqual(out["http_status"], 200)

    def test_busy_port_uses_another(self):
        with socket.socket() as busy:
            busy.bind(("127.0.0.1", 0))
            busy.listen()
            taken = busy.getsockname()[1]
            code, out = run("run_local.py", OK_APP, "--cmd", "node server.js",
                            "--port", taken, "--path", "/health", "--wait", 20)
        self.assertEqual(code, 0, out)
        self.assertNotEqual(out["port"], taken)
        self.assertIn("ocupado", out["warning"])

    def test_path_without_leading_slash(self):
        code, out = run("run_local.py", OK_APP, "--cmd", "node server.js",
                        "--port", 4331, "--path", "health", "--wait", 20)
        self.assertEqual(code, 0, out)
        self.assertTrue(out["url"].endswith("/health"))

    @unittest.skipUnless(shutil.which("cygpath"), "solo en Git Bash / MSYS (Windows)")
    def test_path_mangled_by_git_bash(self):
        # Lo que llega cuando en Git Bash se escribe --path /health
        root = subprocess.run(["cygpath", "-m", "/"], capture_output=True, text=True).stdout.strip()
        code, out = run("run_local.py", OK_APP, "--cmd", "node server.js",
                        "--port", 4341, "--path", root + "health", "--wait", 20)
        self.assertEqual(code, 0, out)
        self.assertTrue(out["url"].endswith(":%d/health" % out["port"]), out["url"])

    def test_app_that_crashes(self):
        code, out = run("run_local.py", BROKEN_APP, "--cmd", "node server.js",
                        "--port", 4399, "--wait", 10)
        self.assertEqual(code, 1)
        self.assertIn("DATABASE_URL", out["log"])


class SprintDoc(unittest.TestCase):
    def test_creates_numbered_sprints_and_index(self):
        with tempfile.TemporaryDirectory() as tmp:
            run("sprint_doc.py", "new", tmp, "--objective", "Backend responde en /health")
            code, out = run("sprint_doc.py", "new", tmp, "--objective", "Agregar tests")
            self.assertEqual(code, 0)
            self.assertTrue(out["created"].endswith("sprint-02.md"))
            index = (Path(tmp) / ".vibecodear" / "README.md").read_text(encoding="utf-8")
            self.assertIn("Agregar tests", index)
            _, listed = run("sprint_doc.py", "list", tmp)
            self.assertEqual(len(listed["sprints"]), 2)

    def test_objective_is_required(self):
        with tempfile.TemporaryDirectory() as tmp:
            code, out = run("sprint_doc.py", "new", tmp)
        self.assertEqual(code, 2)
        self.assertIn("objetivo", out["error"])


if __name__ == "__main__":
    unittest.main()
