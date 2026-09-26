# 🧭 Skill propia: Vibecodear

> Este repositorio contiene dos cosas:
> 1. **La skill Vibecodear** (tarea: skill propia y funcional), en [`.claude/skills/vibecodear/`](.claude/skills/vibecodear/). Se documenta en esta primera parte.
> 2. **MichiCode**, el proyecto sobre el que se demostró la skill. Su documentación original está [más abajo](#-michicode-acortador-de-urls-y-generador-de-códigos-qr).

**Vibecodear** es una skill para **Claude Code** que actúa como un **Engineering Manager técnico**. Entra a un proyecto existente y lo analiza, elige los roles que hacen falta (Backend, QA, DevOps, UX…) y define un objetivo medible. Después ejecuta un **Sprint** completo: implementa, prueba, ejecuta en local, pide feedback y documenta. Cada Sprint queda registrado en `.vibecodear/sprints/sprint-NN.md`.

Funciona con **cualquier proyecto**: detecta Node, Python, Go, Rust, Java, .NET, PHP, Ruby, Docker, Terraform, AWS y MongoDB. Si no reconoce el stack, lo dice y pregunta cómo se ejecuta en lugar de suponerlo.

### ¿Cuándo usarla?

- Pedidos como "vibecodear este proyecto", "hagamos un sprint", "¿qué le falta a este repo?" o "estabiliza/mejora este proyecto".
- **No** usarla para una pregunta puntual o un cambio de una línea.

### Flujo

```
Analizar → Diagnosticar → Roles → Objetivo → Plan ⛔ aprobación → Implementar
→ Probar → Ejecutar local ⛔ feedback → Documentar → Iterar
```

Los ⛔ son puntos de control: la skill **no modifica nada** hasta que el usuario aprueba el plan, y **no cierra el Sprint** sin su feedback.

### Estructura

| Carpeta / archivo | Para qué | Quién lo usa |
| --- | --- | --- |
| [`SKILL.md`](.claude/skills/vibecodear/SKILL.md) | Flujo, puntos de control y reglas de seguridad | Claude (siempre) |
| [`scripts/inspect_project.py`](.claude/skills/vibecodear/scripts/inspect_project.py) | Detecta stack, tests, variables de entorno (solo nombres), posibles secretos, herramientas y puertos | Paso 1 |
| [`scripts/verify.py`](.claude/skills/vibecodear/scripts/verify.py) | Ejecuta build/test/lint por paquete Node, o el comando del stack con `--cmd` | Paso 7 |
| [`scripts/run_local.py`](.claude/skills/vibecodear/scripts/run_local.py) | Levanta la app (`--cmd` o `--compose`), maneja puertos ocupados, comprueba HTTP y la detiene | Paso 8 |
| [`scripts/sprint_doc.py`](.claude/skills/vibecodear/scripts/sprint_doc.py) | Crea `sprint-NN.md` desde la plantilla y el índice de Sprints | Pasos 5 y 9 |
| [`references/roles.md`](.claude/skills/vibecodear/references/roles.md) | Señales, checklist y roadmap de cada rol y tecnología | Paso 3 |
| [`references/troubleshooting.md`](.claude/skills/vibecodear/references/troubleshooting.md) | Qué hacer ante cada error habitual | Cuando hay `warnings` o fallos |
| [`assets/sprint-template.md`](.claude/skills/vibecodear/assets/sprint-template.md) | Plantilla del documento de Sprint | `sprint_doc.py` |
| [`tests/`](.claude/skills/vibecodear/tests/) | 16 pruebas automáticas de los scripts (éxito y error) con fixtures | Validación |
| [`docs/capturas/`](.claude/skills/vibecodear/docs/capturas/) | Capturas de las pruebas y de la ejecución real | Documentación |

Los scripts hacen solo trabajo determinista y devuelven **JSON**. Todas las decisiones (roles, objetivo, plan) las toma Claude siguiendo `SKILL.md`.

### Requisitos

- [Claude Code](https://claude.com/claude-code)
- Python 3.9+ (solo librería estándar; no hace falta `pip install`)
- Node.js 18+ (para proyectos Node y para los tests de ejemplo)
- Docker (opcional, para `run_local.py --compose`)

### Instalación

**En este repositorio:** ya está instalada en `.claude/skills/vibecodear/`. Al abrir Claude Code en esta carpeta aparece como `/vibecodear`.

**En cualquier otro proyecto:** copia la carpeta a tus skills personales y reinicia Claude Code:

```bash
# Windows (PowerShell)
Copy-Item -Recurse .claude\skills\vibecodear $HOME\.claude\skills\vibecodear
# macOS / Linux
cp -r .claude/skills/vibecodear ~/.claude/skills/vibecodear
```

Comprueba que aparece con `/skills`.

### Uso

Dentro de Claude Code, en la raíz del proyecto:

```
/vibecodear <qué quieres lograr>
```

También sirve en lenguaje natural: *"vibecodea este proyecto: quiero que arranque localmente"*.

Los scripts también se pueden ejecutar solos:

```bash
python .claude/skills/vibecodear/scripts/inspect_project.py .
python .claude/skills/vibecodear/scripts/verify.py .                          # proyectos Node
python .claude/skills/vibecodear/scripts/verify.py . --cmd "python -m pytest" # cualquier stack
python .claude/skills/vibecodear/scripts/run_local.py . --cmd "npm run dev" --port 5000 --path /health
python .claude/skills/vibecodear/scripts/run_local.py . --compose --port 80          # todo el stack con Docker
python .claude/skills/vibecodear/scripts/sprint_doc.py new . --objective "El backend responde en /health"
python .claude/skills/vibecodear/scripts/sprint_doc.py list .
```

### Ejemplo real de entrada y resultado

Ejecución real sobre este repositorio, en la que la usuaria había perdido sus archivos `.env`.

**Entrada:**
```
/vibecodear la prioridad es que pueda levantar de manera local y que funcionen sus
funcionalidades [...] olvidé el contenido de mis archivos .env del proyecto, dame una
propuesta de solución
```

**1. Análisis.** `inspect_project.py` devolvió (extracto real; solo nombres de variables, nunca valores):

```json
{
  "ok": true,
  "stack": ["aws", "docker", "docker-compose", "express", "github-actions",
            "mongodb", "node", "react", "terraform", "typescript"],
  "tests": { "count": 0, "files": [] },
  "env": { "missing": ["API_BASE", "DOCKER_USER", "EC2_HOST_DNS"] },
  "possible_secrets": ["backend/src/server.ts:16"],
  "docker_daemon_running": false,
  "warnings": [
    "Dependencias no instaladas en backend (falta node_modules)",
    "Dependencias no instaladas en frontend (falta node_modules)",
    "3 variables de entorno usadas sin definir en ningún .env",
    "No se encontraron archivos de test",
    "1 posibles secretos escritos en el código",
    "El proyecto usa terraform pero 'terraform' no está instalado",
    "El proyecto usa aws pero 'aws' no está instalado"
  ]
}
```

**2. Diagnóstico, roles y objetivo.** Claude verificó, sin mostrar valores, que los `.env` locales eran coherentes con `docker-compose.yml`. Detectó que faltaban plantillas `.env.example` y que Mongo no se publicaba al host. Activó **DevOps, Backend y QA** y propuso el objetivo *"con `docker compose up --build` el frontend responde en `http://localhost` y la API cumple `POST /shorten` 201, `GET /<code>` 301, `GET /<code>/qr` 200 y `GET /urls` 200"*. ⛔ Esperó la aprobación antes de tocar nada.

**3. Resultado.** Se implementó, se probó y se levantó el stack. La usuaria validó la app y el Sprint quedó documentado:

| Comprobación | Resultado |
| --- | --- |
| `GET http://localhost/` (frontend) | 200 |
| `POST /shorten` | 201 |
| `GET /<code>` | 301 → URL original |
| `GET /<code>/qr`, `GET /urls` | 200 |
| Estado del Sprint | ✅ Cumplido |

Documentos generados por la skill: [sprint-01.md](.vibecodear/sprints/sprint-01.md) (recuperar el entorno local) y [sprint-02.md](.vibecodear/sprints/sprint-02.md) (rediseño de la UI). El segundo muestra un **ciclo de feedback**: la primera entrega se rechazó y el Sprint se iteró hasta cumplirse.

### Pruebas y manejo de errores

```bash
cd .claude/skills/vibecodear
python -m unittest discover -s tests -v
```

Resultado esperado: `Ran 16 tests ... OK`. En Linux o macOS aparece `OK (skipped=1)`, porque el test de Git Bash solo corre en Windows.

| Caso | Tipo | Resultado esperado |
| --- | --- | --- |
| Proyecto Node válido (`fixtures/ok-node-app`) | ✅ Éxito | Detecta stack, tests pasan, la app responde 200 en `/health` |
| Ruta que no existe | ❌ Entrada inválida | `ok: false`, código de salida 2 |
| Carpeta sin stack reconocible | ❌ Stack desconocido | `stack: ["unknown"]` |
| Dependencias sin instalar | ❌ Problema habitual | `missing_dependencies`, **no** instala sin permiso |
| Test que falla (`fixtures/broken-app`) | ❌ Tests fallando | `failed` con la salida del error |
| App que se cae al arrancar | ❌ No inicia | `ok: false` y log con la causa (`DATABASE_URL`) |
| Puerto ocupado | ❌ Problema habitual | Usa otro puerto libre y lo avisa |
| `--path health` (sin `/` inicial) | ✅ Entrada tolerada | Normaliza a `/health` |
| `--path /health` escrito en Git Bash (Windows) | ❌ Problema habitual | MSYS lo convierte en `C:/Program Files/Git/health`; el script lo detecta y lo corrige |
| Proyecto Python con carpeta `tests/` | ✅ Otro stack | Detecta `python` y cuenta el test |
| Tests de otro stack con `--cmd` | ✅ Otro stack | Ejecuta el comando indicado y da `passed` |
| Sprint sin objetivo | ❌ Entrada inválida | Error: "Falta --objective" |
| Dos Sprints seguidos | ✅ Éxito | Crea `sprint-01.md`, `sprint-02.md` y el índice |

Además, `run_local.py --compose` reintenta si Docker Desktop aún está arrancando y usa `docker-compose` si el plugin no responde. Se probó con el stack real de MichiCode (captura 8). Qué hacer ante cada error está en [`troubleshooting.md`](.claude/skills/vibecodear/references/troubleshooting.md).

#### Capturas

Salidas reales de los comandos (Git Bash en Windows 11):

**1. Suite completa: 16 tests OK**
![Tests](.claude/skills/vibecodear/docs/capturas/01-tests.png)

**2. ✅ Caso exitoso: `inspect_project.py` detecta un proyecto Node**
![Inspect](.claude/skills/vibecodear/docs/capturas/02-exito-inspect.png)

**3. ✅ Caso exitoso: `run_local.py` levanta la app y `/health` responde 200**
![Run local](.claude/skills/vibecodear/docs/capturas/03-exito-run-local.png)

**4. ❌ Entrada inválida: la ruta no existe**
![Ruta inválida](.claude/skills/vibecodear/docs/capturas/04-error-ruta-invalida.png)

**5. ❌ Problema habitual: los tests del proyecto fallan**
![Tests fallan](.claude/skills/vibecodear/docs/capturas/05-error-tests-fallan.png)

**6. ❌ Problema habitual: la app se cae al arrancar (falta `DATABASE_URL`)**
![App se cae](.claude/skills/vibecodear/docs/capturas/06-error-app-se-cae.png)

**7. ❌ Entrada inválida: Sprint sin objetivo (no escribe nada)**
![Sin objetivo](.claude/skills/vibecodear/docs/capturas/07-error-sprint-sin-objetivo.png)

**8. ✅ Stack completo de MichiCode con Docker Compose → 200**
![Compose](.claude/skills/vibecodear/docs/capturas/08-compose-michicode.png)

### Seguridad

- No muestra valores de `.env` ni secretos (solo nombres y `archivo:línea`).
- Pide confirmación antes de instalar dependencias, borrar, hacer `git push`, `terraform apply`, `docker compose down -v` o cualquier deploy.
- `run_local.py` solo detiene lo que él mismo levantó.

---

# 🐈 MichiCode: Acortador de URLs y Generador de Códigos QR

## 🚀 Resumen del Proyecto

**MichiCode** es una aplicación web completa (Full Stack) diseñada para acortar URLs al instante y generar códigos QR profesionales. La solución está construida con una arquitectura de microservicios contenerizada utilizando Docker y desplegada en una instancia EC2 de AWS, con automatización completa de integración y despliegue continuo (CI/CD) a través de GitHub Actions.

Este proyecto cumple con los requisitos del Segundo Parcial, demostrando el uso de contenedores, orquestación, infraestructura en la nube y pipelines de CI/CD.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend (SPA)** | React, TypeScript, Material UI (MUI) | Interfaz de usuario para acortar URLs y generar QRs, y visualizar el historial. |
| **Backend (API REST)** | Node.js, Express, TypeScript | Implementa la lógica de negocio, manejo de endpoints API REST (`/api/*`) y redireccionamiento (`/*`). |
| **Base de Datos** | MongoDB (NoSQL) | Persistencia de datos para las URLs cortas, códigos QR y estadísticas de clicks. |
| **Contenerización** | Docker, Docker Compose | Cada componente se ejecuta en un contenedor independiente. |
| **Infraestructura** | Amazon EC2 (AWS) | Host de ejecución para los contenedores en producción. |
| **CI/CD** | GitHub Actions | Pipeline automatizado de construcción, testeo y despliegue. |

---

## Arquitectura de la Solución

La aplicación sigue una arquitectura de tres capas completamente contenerizadas.

### Componentes

1.  **`michicode-mongo` (DB):** Contenedor de MongoDB (v6) que maneja la persistencia de datos. No se expone públicamente.
2.  **`michicode-backend` (API):** Contenedor de Node.js/Express (puerto 5000). Se conecta a `michicode-mongo` y expone las rutas de la API y el servicio de redireccionamiento.
3.  **`michicode-frontend` (SPA):** Contenedor de React servido por Nginx (puerto 80). Se comunica con el backend a través de `http://52.33.205.250:5000` (o la IP pública de la EC2).

## ⚙️ Configuración y Despliegue Local (Docker Compose)

El proyecto incluye un archivo `docker-compose.yml` para levantar todo el stack en un entorno de desarrollo local.

### Prerrequisitos
* Docker y Docker Compose instalados.

### Variables de Entorno (Local)

Los archivos `.env` no se versionan. Créalos a partir de las plantillas incluidas (valores de desarrollo, iguales a los de este README):

```bash
cp .env.example .env                    # credenciales de Mongo para docker compose
cp backend/.env.example backend/.env    # PORT, MONGODB_URI, PUBLIC_URL_HOST
cp frontend/.env.example frontend/.env  # REACT_APP_API_BASE_URL
```

> Las variables `MONGO_INITDB_*` solo se aplican la primera vez que se crea el volumen `mongo-data`. Si cambias la contraseña, recrea el volumen con `docker-compose down -v` (borra los datos locales).

Para desarrollar sin Docker en el backend (`npm run dev`), `docker-compose.yml` publica Mongo en `127.0.0.1:27017`.

### Comandos de Ejecución

1.  **Levantar el Stack:**
    ```bash
    docker-compose up --build -d
    ```

2.  **Acceso:**
    * **Frontend (App):** Acceder en `http://localhost:80`
    * **Backend (API):** Acceder en `http://localhost:5000`

3.  **Detener y Limpiar:**
    ```bash
    docker-compose down -v
    ```

---

## ☁️ Despliegue en Producción (AWS EC2)

El despliegue en la instancia EC2 se realiza manualmente (o vía GitHub Actions) utilizando comandos `docker run` para una orquestación simple.

### Variables de Entorno Clave

| Servicio | Variable | Valor en Producción | Descripción |
| :--- | :--- | :--- | :--- |
| **Backend** | `MONGODB_URI` | `mongodb://root:rootpassword@michicode-mongo:27017/michicode?authSource=admin` | Conexión a la base de datos dentro de la red Docker. |
| **Backend** | `PUBLIC_URL_HOST` | `http://52.33.205.250:5000` | URL base utilizada para generar las URLs cortas y los QRs. |
| **Frontend** | `REACT_APP_API_BASE_URL` | `http://52.33.205.250:5000` | URL para que el frontend acceda al backend (configurada durante el build). |
| **MongoDB** | `MONGO_INITDB_ROOT_PASSWORD` | `rootpassword` | Credencial de acceso a la DB. |

### Comandos de Despliegue Manual en EC2

Se utiliza una red Docker (`michicode-net`) para permitir la comunicación interna.

1.  **Limpieza y Creación de la Red (Si es necesario):**
    ```bash
    docker stop frontend backend michicode-mongo
    docker rm frontend backend michicode-mongo
    docker container prune -f
    docker network create michicode-net 
    ```

2.  **Iniciar MongoDB (DB):**
    ```bash
    docker run -d \
      --name michicode-mongo \
      --network michicode-net \
      -p 27017:27017 \
      -e MONGO_INITDB_ROOT_USERNAME=root \
      -e MONGO_INITDB_ROOT_PASSWORD=rootpassword \
      -e MONGO_INITDB_DATABASE=michicode \
      mongo:6
    ```

3.  **Iniciar Backend (API):**
    ```bash
    docker run -d \
      --name backend \
      --network michicode-net \
      -p 5000:5000 \
      -e PORT=5000 \
      -e MONGODB_URI="mongodb://root:rootpassword@michicode-mongo:27017/michicode?authSource=admin" \
      -e PUBLIC_URL_HOST="http://52.33.205.250:5000" \
      marianz16/michicode-backend:latest
    ```

4.  **Iniciar Frontend (Web):**
    ```bash
    docker run -d \
      --name frontend \
      --network michicode-net \
      -p 80:80 \
      marianz16/michicode-frontend:latest
    ```

### Acceso Público

El proyecto está accesible públicamente a través de la IP de la instancia EC2 en el puerto 80 (HTTP estándar):

**URL Pública:** `http://52.33.205.250/`

---

## 🔄 CI/CD con GitHub Actions

El pipeline de CI/CD (definido en `.github/workflows/deploy.yml`) se encarga de automatizar la construcción, el testeo y el despliegue a la instancia EC2.

### Secrets requeridos (GitHub → Settings → Secrets and variables → Actions)

| Secret | Cómo obtenerlo / regenerarlo |
| :--- | :--- |
| `DOCKER_HUB_USERNAME` | Tu usuario de Docker Hub. |
| `DOCKER_HUB_TOKEN` | Docker Hub → Account Settings → Personal access tokens (Read & Write). |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS IAM → usuario del pipeline → Security credentials → Create access key (desactiva la anterior). |
| `SSH_PRIVATE_KEY` | Contenido del `.pem` del key pair de la EC2 (si se perdió, crea un key pair nuevo y registra su clave pública en la instancia). |
| `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` | Credenciales de Mongo en producción; si cambian, el volumen existente conserva las antiguas. |
| `DISCORD_WEBHOOK` | Discord → Configuración del canal → Integraciones → Webhooks → Copiar URL. |

### Flujo de Trabajo

1.  **`on: push`** en la rama `main` y `workflow_dispatch` (ejecución manual).
2.  **Jobs:**
    * **`build-and-test`**: Ejecuta las pruebas unitarias y de integración. (No se detalla en el YAML subido, pero es una sugerencia de buena práctica).
    * **`build-images`**: Construye las imágenes de Docker para el frontend y el backend y las etiqueta con el SHA del commit. Luego, realiza el push a Docker Hub (o un registry configurado).
    * **`deploy`**: Se conecta por SSH a la instancia EC2 y ejecuta los comandos de `docker pull` y `docker run` para actualizar y levantar los contenedores.