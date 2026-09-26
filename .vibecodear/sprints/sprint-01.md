# Sprint 01

- **Fecha:** 2026-09-26
- **Sprint anterior:** — (primer Sprint)
- **Objetivo:** Con docker compose up --build el frontend responde en http://localhost y la API cumple: POST /shorten 201, GET /<code> 301, GET /<code>/qr 200, GET /urls 200
- **Criterio de aceptación:** `curl` contra el stack levantado devuelve esos códigos, y el usuario confirma que la UI acorta URLs, genera QR y muestra historial.
- **Estado final:** ✅ Cumplido

## 1. Diagnóstico
- Motivo: la usuaria olvidó el contenido de sus `.env` y necesita levantar el proyecto en local.
- Stack: React + TS (frontend, Nginx), Express + TS (backend), MongoDB 6, Docker Compose, Prometheus/Grafana, Terraform + GitHub Actions hacia EC2.
- Los tres `.env` (raíz, `backend/`, `frontend/`) existían y eran coherentes entre sí. Se verificó sin mostrar valores y usan los valores de desarrollo del README.
- Los `.env` nunca se commitearon, así que no se pueden recuperar del historial de git.
- No había plantillas `.env.example`, que es la causa de fondo de la pérdida.
- Mongo no se publicaba al host, así que `npm run dev` del backend no podía conectarse.
- La URI por defecto en `server.ts` tenía espacios sobrantes al final.
- No hay tests. El frontend tiene dos advertencias de lint `react-hooks/exhaustive-deps` que ya existían.
- Los secrets de GitHub Actions no se pueden recuperar; hay que regenerarlos.

## 2. Roles utilizados
| Rol | Por qué se activó | Roadmap consultado |
| --- | --- | --- |
| DevOps | Variables de entorno, Compose, volumen de Mongo, secrets de CI | https://roadmap.sh/devops |
| Backend | Conexión a Mongo y URI por defecto | https://roadmap.sh/backend |
| QA | Validación end-to-end de las funcionalidades | https://roadmap.sh/qa |

## 3. Decisiones
| Decisión | Alternativas | Motivo |
| --- | --- | --- |
| Mantener la contraseña de Mongo del README (`MONGO_INITDB_ROOT_PASSWORD`) | Generar una aleatoria | La usuaria lo pidió explícitamente; es solo para local. |
| Publicar Mongo en `127.0.0.1:27017` | No publicarlo; usar un override | Permite `npm run dev` sin exponer Mongo a la red. |
| Versionar `.env.example` con valores de desarrollo | Plantillas vacías | Son los mismos valores públicos del README; así el arranque es inmediato. |
| No tocar las advertencias de lint del frontend | Corregirlas | No bloquean el build de Docker; están fuera del objetivo. |

## 4. Tareas
| # | Tarea | Rol | Verificación | Estado |
| --- | --- | --- | --- | --- |
| 1 | Crear `.env.example` (raíz, backend, frontend) | DevOps | `git check-ignore`: plantillas versionables, `.env` ignorados | ✅ |
| 2 | Contraseña de Mongo | DevOps | Se mantiene la del README a pedido de la usuaria; coherencia verificada | ✅ |
| 3 | Publicar Mongo en localhost | DevOps | `docker port`, backend conectado | ✅ |
| 4 | Corregir la URI por defecto en `server.ts` | Backend | `npm run build` pasa | ✅ |
| 5 | Levantar el stack y probar los endpoints | QA | `curl` (ver §6) | ✅ |
| 6 | Documentar en README y en este Sprint | DevOps | Lectura | ✅ |

## 5. Cambios realizados
| Archivo | Cambio |
| --- | --- |
| `.env.example`, `backend/.env.example`, `frontend/.env.example` | Nuevas plantillas de variables de entorno |
| `docker-compose.yml` | Mongo publicado en `127.0.0.1:27017` |
| `backend/src/server.ts` | Quitados los espacios sobrantes de la URI por defecto |
| `README.md` | Secciones "Variables de Entorno (Local)" y "Secrets requeridos" |
| `.gitignore` | (Cambio previo de la usuaria) ignora `.env` |

## 6. Pruebas y resultados
- `verify.py`: backend build ✅. El frontend build falla solo con `CI=true` por las dos advertencias de lint que ya existían; con `CI=false` y en Docker compila. No hay tests.
- `docker-compose up --build -d`: los 5 contenedores quedan arriba y el backend registra "Conectado a MongoDB".
- Endpoints:
  - `GET http://localhost/`: 200.
  - `GET :5000/`: 200.
  - `POST /shorten`: 201, con `shortUrl` = `http://localhost:5000/<code>`.
  - `GET /<code>`: 301 hacia la URL original.
  - `GET /<code>/qr`: 200.
  - `GET /urls` y `GET /api/urls`: 200.
  - `POST /qr/save`: 201.
  - `GET /qr/history`: 200.
  - Grafana `:3000/login`: 200.
- El bundle del frontend contiene `http://localhost:5000` como URL de la API.

## 7. Problemas encontrados
- Docker Desktop estaba apagado. Se inició, pero el primer intento devolvió 500 en `_ping` mientras arrancaba. Se resolvió esperando.
- `run_local.py --compose` falló en el build mientras el daemon aún no estaba estable. Se levantó con `docker-compose up --build -d`.

## 8. Feedback del usuario
La usuaria probó la app y la aprobó ("APROBADO"). Pidió commit, push y merge a `main`.

## 9. Próximos pasos
- Regenerar los secrets de GitHub Actions (lista en el README) antes del próximo deploy.
- Producción: `docker-compose.prod.yml` define `BASE_URL`, pero el código lee `PUBLIC_URL_HOST`. Unificar.
- Corregir las advertencias `exhaustive-deps` y agregar tests mínimos (backend con supertest, frontend con RTL).
- Montar `database/init-mongo.js` en el compose para crear el índice único de `short_code`.
