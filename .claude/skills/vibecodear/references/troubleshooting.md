# Troubleshooting

Qué hacer ante cada problema habitual. La detección viene de los JSON de los scripts.

| Problema | Cómo se detecta | Qué hacer |
| --- | --- | --- |
| **Dependencias faltantes** | `warnings`: "Dependencias no instaladas"; `verify.py` → `missing_dependencies` | Explicar qué falta y pedir permiso para `verify.py --install` (o `npm install`). No instalar sin permiso. |
| **Herramienta no instalada** | `tools.<nombre>` es `null` | Indicar cómo instalarla (Node: nodejs.org, Docker Desktop, Terraform: developer.hashicorp.com). Continuar con lo que sí se puede verificar. |
| **Tests fallando** | `verify.py` → `failed` | Leer `output`. Comparar con el estado anterior (¿fallaba antes de tus cambios?). Arreglar solo lo que corresponde al objetivo; documentar el resto. |
| **Sin tests** | `tests.count = 0` o `no_tests` | Rol QA: añadir al menos un test del caso feliz y uno inválido del área que tocas. |
| **El proyecto no inicia** | `run_local.py` → `ok: false` con `log` | Leer el `log`: módulo no encontrado → dependencias; `EADDRINUSE` → puerto; error de conexión a BD → servicio o URI; variable `undefined` → configuración. |
| **Configuración incompleta** | `env.missing` no vacío | Crear/actualizar `.env.example` con los nombres (sin valores reales) y pedir al usuario que complete su `.env`. Nunca mostrar valores. |
| **Puertos ocupados** | `ports_in_use`; `run_local.py` → `warning` | En modo `--cmd` el script usa otro puerto libre. En Compose, proponer cambiar el mapeo `HOST:CONTENEDOR` o detener el proceso que lo ocupa (con permiso). |
| **Docker apagado** | `docker_daemon_running: false` | Pedir al usuario que abra Docker Desktop; mientras, ejecutar servicios con `--cmd`. |
| **Docker aún arrancando** | `run_local.py --compose` → `docker compose up falló` con `_ping`, `500 Internal Server Error` o `unknown flag` en el `log` (tras agotar `attempts`) | Docker Desktop no terminó de iniciar. Esperar a que diga *Engine running* y relanzar. El script ya reintenta 3 veces cada 10 s y usa `docker-compose` si el plugin `docker compose` no responde. |
| **Stack desconocido** | `stack: ["unknown"]` | No suponer. Leer README/archivos raíz y preguntar al usuario cómo se construye, prueba y ejecuta. Usar `verify.py --cmd` y `run_local.py --cmd` con los comandos que indique. |
| **Stack sin package.json** (Python, Go, Java…) | `verify.py` → `note` pide `--cmd` | Elegir el comando de tests del stack y relanzar `verify.py --cmd "<comando>"`. |
| **Posibles secretos en el código** | `possible_secrets` | Mostrar solo archivo:línea. Proponer moverlos a variables de entorno y rotarlos si ya se subieron a Git. |
| **Ruta inválida** | `ok: false`, código de salida 2 | Pedir la ruta correcta al usuario. |
| **`--path` convertido por Git Bash** | `run_local.py` → `error` "--path recibió una ruta de Windows" | En Git Bash (Windows), MSYS convierte `/health` en `C:/Program Files/Git/health`. El script lo corrige solo si `cygpath` está disponible; si no, relanzar con `--path health` (sin barra) o anteponer `MSYS_NO_PATHCONV=1`. |
