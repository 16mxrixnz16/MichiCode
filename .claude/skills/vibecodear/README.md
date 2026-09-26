# 🧭 Vibecodear

Skill para **Claude Code** que actúa como un **Engineering Manager técnico**: entra a un proyecto existente, lo analiza, elige los roles que hacen falta (Backend, QA, DevOps, UX…), define un objetivo medible y ejecuta un **Sprint** completo, desde implementar y probar hasta ejecutar localmente, pedir feedback y documentar. Cada Sprint queda registrado en `.vibecodear/sprints/sprint-NN.md`.

Funciona con **cualquier proyecto**: detecta Node, Python, Go, Rust, Java, .NET, PHP, Ruby, Docker, Terraform, AWS y MongoDB. Si no reconoce el stack, lo dice y pregunta cómo se ejecuta en lugar de suponerlo.

## ¿Cuándo usarla?

- "Vibecodear este proyecto", "hagamos un sprint", "¿qué le falta a este repo?", "estabiliza/mejora este proyecto".
- **No** usarla para una pregunta puntual o un cambio de una línea.

## Flujo

```
Analizar → Diagnosticar → Roles → Objetivo → Plan ⛔ aprobación → Implementar
→ Probar → Ejecutar local ⛔ feedback → Documentar → Iterar
```

## Estructura

| Carpeta / archivo | Para qué | Quién lo usa |
| --- | --- | --- |
| `SKILL.md` | Flujo, puntos de control y reglas de seguridad | Claude (siempre) |
| `scripts/inspect_project.py` | Detecta stack, tests, variables de entorno, secretos, herramientas y puertos | Paso 1 |
| `scripts/verify.py` | Ejecuta build/test/lint por paquete Node, o el comando del stack con `--cmd` | Paso 7 |
| `scripts/run_local.py` | Levanta la app, maneja puertos ocupados, comprueba HTTP y la detiene | Paso 8 |
| `scripts/sprint_doc.py` | Crea `sprint-NN.md` y el índice de Sprints | Pasos 5 y 9 |
| `references/roles.md` | Señales, checklist y **enlace al roadmap** de cada rol y tecnología | Paso 3 (y al asumir cada rol) |
| `references/troubleshooting.md` | Qué hacer ante cada error habitual | Cuando hay `warnings` o fallos |
| `assets/sprint-template.md` | Plantilla del documento de Sprint | `sprint_doc.py` |
| `tests/` | Pruebas automáticas de los scripts (casos exitosos y de error) | Tú, para validar |

## Requisitos

- [Claude Code](https://claude.com/claude-code)
- Python 3.9+ (solo librería estándar; no hace falta `pip install`)
- Node.js 18+ (solo para proyectos Node y para los tests de ejemplo)
- Docker (opcional, para `run_local.py --compose`)

## Instalación

**Solo en este proyecto:** ya está instalada en `.claude/skills/vibecodear/`.

**En cualquier proyecto:** copia la carpeta a tus skills personales:

```bash
# Windows (PowerShell)
Copy-Item -Recurse .claude\skills\vibecodear $HOME\.claude\skills\vibecodear
# macOS / Linux
cp -r .claude/skills/vibecodear ~/.claude/skills/vibecodear
```

Reinicia Claude Code y comprueba que aparece con `/skills`.

## Uso

Dentro de Claude Code, en la raíz del proyecto:

```
/vibecodear
```
o en lenguaje natural: *"vibecodea este proyecto: quiero que arranque localmente"*.

Los scripts también se pueden ejecutar solos:

```bash
python .claude/skills/vibecodear/scripts/inspect_project.py .
python .claude/skills/vibecodear/scripts/verify.py .                          # proyectos Node
python .claude/skills/vibecodear/scripts/verify.py . --cmd "python -m pytest" # cualquier stack
python .claude/skills/vibecodear/scripts/run_local.py . --cmd "npm run dev" --port 5000
python .claude/skills/vibecodear/scripts/sprint_doc.py new . --objective "El backend responde en /health"
python .claude/skills/vibecodear/scripts/sprint_doc.py list .
```

## Ejemplo de entrada y resultado esperado

**Entrada (en Claude Code, dentro de cualquier proyecto):**
```
/vibecodear quiero que el proyecto arranque localmente y tenga tests
```

**Qué hace la skill:** ejecuta `inspect_project.py` sobre la raíz del proyecto y obtiene un JSON con esta forma (ejemplo ilustrativo de una API Node + MongoDB sin configurar):

```json
{
  "ok": true,
  "stack": ["docker", "docker-compose", "express", "mongodb", "node"],
  "tests": { "count": 0, "files": [] },
  "env": { "missing": ["MONGODB_URI", "PORT"] },
  "possible_secrets": ["src/db.js:3"],
  "warnings": [
    "Dependencias no instaladas en . (falta node_modules)",
    "2 variables de entorno usadas sin definir en ningún .env",
    "No se encontraron archivos de test"
  ]
}
```

**Resultado esperado:** Claude presenta el diagnóstico, elige roles (p. ej. **DevOps + Backend + QA**), propone un objetivo medible como *"la API arranca localmente y `GET /health` responde 200"* y **espera tu aprobación**. Luego implementa, prueba, ejecuta localmente, pide tu feedback y genera:

```
.vibecodear/
├── README.md            # índice: Sprint | Objetivo | Estado
└── sprints/
    └── sprint-01.md     # objetivo, diagnóstico, roles, decisiones, tareas, cambios, pruebas, problemas, feedback, estado
```

## Pruebas

```bash
cd .claude/skills/vibecodear
python -m unittest discover -s tests -v
```

Resultado esperado: `Ran 14 tests ... OK`.

| Caso | Tipo | Resultado esperado |
| --- | --- | --- |
| Proyecto Node válido (`fixtures/ok-node-app`) | ✅ Éxito | Detecta stack, tests pasan, la app responde 200 en `/health` |
| Ruta que no existe | ❌ Entrada inválida | `ok: false`, código de salida 2 |
| Carpeta sin stack reconocible | ❌ Stack desconocido | `stack: ["unknown"]` |
| Dependencias sin instalar | ❌ Problema habitual | `missing_dependencies`, **no** instala sin permiso |
| Test que falla (`fixtures/broken-app`) | ❌ Tests fallando | `failed` con la salida del error |
| App que se cae al arrancar | ❌ No inicia | `ok: false` y log con la causa (`DATABASE_URL`) |
| Puerto ocupado | ❌ Problema habitual | Usa otro puerto libre y lo avisa |
| Proyecto Python con carpeta `tests/` | ✅ Otro stack | Detecta `python` y cuenta el test |
| Tests de otro stack con `--cmd` | ✅ Otro stack | Ejecuta el comando indicado y da `passed` |
| Sprint sin objetivo | ❌ Entrada inválida | Error: "Falta --objective" |
| Dos Sprints seguidos | ✅ Éxito | Crea `sprint-01.md`, `sprint-02.md` y el índice |

## Seguridad

- No muestra valores de `.env` ni secretos (solo nombres y `archivo:línea`).
- Pide confirmación antes de instalar dependencias, borrar, hacer `git push`, `terraform apply`, `docker compose down -v` o cualquier deploy.
- `run_local.py` solo detiene lo que él mismo levantó.
