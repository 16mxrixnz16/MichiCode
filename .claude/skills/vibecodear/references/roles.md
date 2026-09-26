# Roles de Vibecodear

Activa un rol **solo** si aparece alguna de sus señales en el diagnóstico.

## Cómo adquirir el conocimiento de un rol

Cada rol y tecnología tiene un **roadmap de referencia** (columna *Fuente de conocimiento*). Al activar un rol:

1. Usa el **checklist** de esta tabla como base mínima: funciona sin conexión.
2. Si la tarea requiere más profundidad (p. ej. una decisión de arquitectura, una estrategia de tests, un problema de infraestructura), **abre su roadmap con WebFetch** y consulta solo los temas relacionados con la tarea actual.
3. Usa el roadmap como **mapa de temas** para decidir qué revisar y qué buenas prácticas aplicar. **No copies su contenido** en el proyecto ni en la documentación del Sprint; cita el enlace si una decisión se apoyó en él.
4. Si no hay conexión o el enlace no carga, continúa con el checklist y anótalo en *Problemas encontrados* del Sprint.

**Roadmap transversal:** [Vibe Coding](https://roadmap.sh/vibe-coding) aplica siempre. Úsalo para trabajar con IA de forma segura: cambios pequeños y verificables, revisar lo generado, probar antes de aceptar y no confiar en código que no entiendes.

## Roles

| Rol | Fuente de conocimiento | Señales que lo activan | Checklist | Entrega |
| --- | --- | --- | --- | --- |
| **Engineering Manager** | [roadmap.sh/engineering-manager](https://roadmap.sh/engineering-manager) | Siempre (coordina) | Priorizar por impacto/riesgo, limitar alcance, explicar trade-offs | Objetivo, roles y plan |
| **Scrum Master** | [roadmap.sh/engineering-manager](https://roadmap.sh/engineering-manager) (temas de procesos ágiles y entrega) | Varias tareas o Sprints previos | Sprint corto, tareas pequeñas, impedimentos visibles, retro breve | Tablero de tareas y bloqueos |
| **Product Owner** | [roadmap.sh/product-design](https://roadmap.sh/product-design) (temas de producto y usuario) | Objetivo ambiguo, funcionalidades a medias | Valor para el usuario, criterio de aceptación medible, qué queda fuera | Objetivo y criterio de aceptación |
| **Software Architect** | [roadmap.sh/software-architect](https://roadmap.sh/software-architect) | Acoplamiento, capas mezcladas, decisión técnica grande | Límites entre módulos, flujo de datos, configuración por entorno, no sobre-diseñar | Decisiones con alternativas y motivo |
| **Frontend** | [roadmap.sh/frontend](https://roadmap.sh/frontend) | Cambios en UI, errores de build del cliente | Componentes pequeños, estado claro, manejo de carga/error, URL de API configurable | Cambios de UI verificados en navegador |
| **Backend** | [roadmap.sh/backend](https://roadmap.sh/backend) | API, rutas, modelos, conexión a BD | Validación de entrada, códigos HTTP correctos, errores manejados, endpoint `/health` | Endpoints probados |
| **Full Stack** | [roadmap.sh/full-stack](https://roadmap.sh/full-stack) | Cambio que cruza cliente y servidor | Contrato de API consistente en ambos lados, CORS, variables de entorno | Flujo extremo a extremo funcionando |
| **QA** | [roadmap.sh/qa](https://roadmap.sh/qa) | Sin tests, tests fallando, bugs reportados | Caso feliz + caso inválido + caso límite, tests repetibles, no romper lo existente | Tests y resultados de verify.py |
| **DevOps** | [roadmap.sh/devops](https://roadmap.sh/devops) | Docker/Compose, CI, puertos, .env, no arranca | Build reproducible, `.env.example`, healthchecks, no secretos en imágenes ni repo | App arrancando con run_local.py |
| **UX** | [roadmap.sh/ux-design](https://roadmap.sh/ux-design) | Flujos confusos, feedback del usuario sobre uso | Mensajes de error claros, estados vacíos, accesibilidad básica, responsive | Mejoras de interacción |
| **Product Design** | [roadmap.sh/product-design](https://roadmap.sh/product-design) | Nueva funcionalidad o rediseño | Problema del usuario, propuesta mínima, consistencia visual | Propuesta validada con el usuario |

## Especialidades de stack

Se activan junto al rol que corresponda (normalmente DevOps o Backend) cuando la tecnología aparece en `stack` del JSON de `inspect_project.py`.

| Tecnología | Fuente de conocimiento | Señales (`stack`) | Revisar |
| --- | --- | --- | --- |
| **Docker** | [roadmap.sh/docker](https://roadmap.sh/docker) | `docker`, `docker-compose` | Imágenes multi-stage, `depends_on` + healthcheck, puertos host libres, volúmenes, variables sin valores por defecto inseguros |
| **MongoDB** | [roadmap.sh/mongodb](https://roadmap.sh/mongodb) | `mongodb` | URI desde variable de entorno, manejo de error de conexión, índices en campos de búsqueda, validación en esquemas |
| **Terraform** | [roadmap.sh/terraform](https://roadmap.sh/terraform) | `terraform` | `fmt` y `validate`, variables sin secretos, estado remoto, **nunca** `apply` sin confirmación |
| **AWS** | [roadmap.sh/aws](https://roadmap.sh/aws) | `aws` | Security groups mínimos (no `0.0.0.0/0` salvo HTTP/HTTPS), credenciales solo en secrets de CI, región explícita |

> Si el proyecto usa una tecnología que no está en esta tabla (Go, Java, PHP, etc.), busca su roadmap en [roadmap.sh](https://roadmap.sh) y aplica el mismo procedimiento.
