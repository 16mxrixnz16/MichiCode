"""Levanta el proyecto localmente, comprueba que responde por HTTP y lo detiene.

Uso:
  python run_local.py CARPETA --cmd "npm start" --port 5000 [--path /] [--wait 60] [--keep]
  python run_local.py CARPETA --compose --port 5000 [--path /] [--keep]

- Si el puerto está ocupado, busca uno libre y lo pasa como variable PORT (modo --cmd).
- Detiene solo lo que levantó (nunca usa `docker compose down -v`).
- `--path` acepta "/health" o "health". En Git Bash (Windows), MSYS convierte "/health" en
  "C:/Program Files/Git/health"; el script deshace esa conversión.
- Compose: usa `docker compose` o, si el plugin no está, `docker-compose`; si Docker
  aún está arrancando, reintenta `up` unas veces antes de rendirse.
Código de salida: 0 = la app respondió, 1 = no arrancó, 2 = entrada inválida.
"""
import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex(("127.0.0.1", port)) == 0


def free_port(start):
    for p in range(start + 1, start + 200):
        if not port_in_use(p):
            return p
    raise RuntimeError("No hay puertos libres cerca de %d" % start)


def http_status(url):
    try:
        with urllib.request.urlopen(url, timeout=3) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return None


def wait_for(url, seconds, proc=None):
    deadline = time.time() + seconds
    while time.time() < deadline:
        if proc is not None and proc.poll() is not None:
            return None
        code = http_status(url)
        if code is not None and code < 500:
            return code
        time.sleep(1)
    return None


def kill_tree(proc):
    if proc.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True)
    else:
        proc.terminate()
        try:
            proc.wait(10)
        except subprocess.TimeoutExpired:
            proc.kill()


def url_path(path):
    """Ruta HTTP a comprobar, siempre empezando con "/".

    Git Bash (MSYS) reescribe los argumentos que parecen rutas POSIX: "/health" llega como
    "C:/Program Files/Git/health". Se detecta la unidad de Windows y se quita la raíz de
    MSYS (la da `cygpath`). Lanza ValueError si no se puede recuperar la ruta original.
    """
    if re.match(r"^[A-Za-z]:[\\/]", path):
        norm = path.replace("\\", "/")
        root = None
        if shutil.which("cygpath"):
            r = subprocess.run(["cygpath", "-m", "/"], capture_output=True, text=True)
            root = r.stdout.strip().rstrip("/") if r.returncode == 0 else None
        if not root or not norm.lower().startswith(root.lower() + "/"):
            raise ValueError(
                f"--path recibió una ruta de Windows ({path}). Si usas Git Bash, escribe la ruta "
                "sin la barra inicial (--path health) o antepón MSYS_NO_PATHCONV=1 al comando.")
        path = norm[len(root):]
    return path if path.startswith("/") else "/" + path


# Mensajes que indica Docker cuando el daemon todavía está arrancando
DOCKER_STARTING = ("_ping", "500 Internal Server Error", "Cannot connect to the Docker daemon",
                   "error during connect", "unknown flag", "is not a docker command")
COMPOSE_RETRIES = 3
COMPOSE_RETRY_WAIT = 10


def compose_base():
    """`docker compose` (plugin) o, si no responde, el binario clásico `docker-compose`."""
    if subprocess.run(["docker", "compose", "version"], capture_output=True).returncode == 0:
        return ["docker", "compose"]
    if shutil.which("docker-compose"):
        return ["docker-compose"]
    return None


def compose_up(folder):
    """Ejecuta `compose up -d --build`, reintentando si Docker aún está arrancando.
    Devuelve (base, proceso, intentos)."""
    for attempt in range(1, COMPOSE_RETRIES + 1):
        base = compose_base()
        if base is None:
            if attempt == COMPOSE_RETRIES:
                return None, None, attempt
            time.sleep(COMPOSE_RETRY_WAIT)
            continue
        up = subprocess.run(base + ["up", "-d", "--build"], cwd=folder, capture_output=True,
                            text=True, encoding="utf-8", errors="replace")
        starting = any(m in up.stdout + up.stderr for m in DOCKER_STARTING)
        if up.returncode == 0 or not starting or attempt == COMPOSE_RETRIES:
            return base, up, attempt
        time.sleep(COMPOSE_RETRY_WAIT)
    return None, None, COMPOSE_RETRIES


def log_tail(path, n=25):
    try:
        return "\n".join(Path(path).read_text(encoding="utf-8", errors="replace").splitlines()[-n:])
    except OSError:
        return ""


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--cmd")
    ap.add_argument("--compose", action="store_true")
    ap.add_argument("--port", type=int, required=True)
    ap.add_argument("--path", default="/")
    ap.add_argument("--wait", type=int, default=60)
    ap.add_argument("--keep", action="store_true")
    args = ap.parse_args()

    folder = Path(args.folder).resolve()
    out = {"folder": str(folder), "requested_port": args.port}
    if not folder.is_dir():
        out.update(ok=False, error=f"Carpeta inválida: {folder}")
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 2
    try:
        path = url_path(args.path)
    except ValueError as e:
        out.update(ok=False, error=str(e))
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 2
    if not args.cmd and not args.compose:
        out.update(ok=False, error="Indica --cmd \"<comando>\" o --compose")
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 2

    if args.compose:
        if not shutil.which("docker"):
            out.update(ok=False, error="Docker no está instalado")
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 1
        if subprocess.run(["docker", "info"], capture_output=True).returncode != 0:
            out.update(ok=False, error="El daemon de Docker no está corriendo (abre Docker Desktop)")
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 1
        base, up, attempts = compose_up(folder)
        if base is None:
            out.update(ok=False, error="No se encontró Docker Compose (ni `docker compose` ni `docker-compose`)")
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 1
        out.update(compose=" ".join(base), attempts=attempts)
        if up.returncode != 0:
            out.update(ok=False, error="docker compose up falló",
                       log="\n".join((up.stdout + up.stderr).splitlines()[-25:]))
            print(json.dumps(out, ensure_ascii=False, indent=2))
            return 1
        url = f"http://127.0.0.1:{args.port}{path}"
        code = wait_for(url, args.wait)
        ps = subprocess.run(base + ["ps"], cwd=folder, capture_output=True, text=True,
                            encoding="utf-8", errors="replace")
        out.update(ok=code is not None, url=url, http_status=code, services=ps.stdout.strip())
        if code is None:
            logs = subprocess.run(base + ["logs", "--tail", "25"], cwd=folder,
                                  capture_output=True, text=True, encoding="utf-8", errors="replace")
            out["log"] = logs.stdout[-4000:]
        if not args.keep:
            subprocess.run(base + ["stop"], cwd=folder, capture_output=True)
            out["stopped"] = f"{' '.join(base)} stop (los volúmenes se conservan)"
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0 if code is not None else 1

    port = args.port
    if port_in_use(port):
        port = free_port(port)
        out["warning"] = f"El puerto {args.port} estaba ocupado; se usó {port}"
    log_path = Path(tempfile.gettempdir()) / f"vibecodear-run-{port}.log"
    log = open(log_path, "w", encoding="utf-8")
    env = {**os.environ, "PORT": str(port), "BROWSER": "none"}
    proc = subprocess.Popen(args.cmd, cwd=folder, shell=True, stdout=log, stderr=subprocess.STDOUT, env=env)
    url = f"http://127.0.0.1:{port}{path}"
    code = wait_for(url, args.wait, proc)
    log.flush()
    out.update(ok=code is not None, url=url, port=port, http_status=code, log_file=str(log_path))
    if code is None:
        out["error"] = ("El proceso terminó antes de responder" if proc.poll() is not None
                        else f"No respondió en {args.wait}s")
        out["log"] = log_tail(log_path)
    if args.keep and code is not None:
        out["pid"] = proc.pid
        out["note"] = "La app sigue corriendo. Para detenerla: taskkill /PID %d /T /F (Windows) o kill %d" % (proc.pid, proc.pid)
    else:
        kill_tree(proc)
        out["stopped"] = True
    log.close()
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0 if code is not None else 1


if __name__ == "__main__":
    sys.exit(main())
