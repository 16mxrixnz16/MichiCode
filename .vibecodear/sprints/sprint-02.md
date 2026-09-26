# Sprint 02

- **Fecha:** 2026-09-26
- **Sprint anterior:** [sprint-01](sprint-01.md), en el que se recuperó el entorno local y se crearon los `.env.example`
- **Objetivo:** UI moderna con gatos y maullidos. El build con `CI=true` pasa sin advertencias, los tests verifican que cada clic emite un maullido de tipo variable y la usuaria valida el diseño en http://localhost.
- **Criterio de aceptación:**
  - `verify.py` en verde, con build y test del backend y del frontend;
  - tests de `meow.ts` con 40 clics seguidos sin repetir tipo y al menos 4 tipos distintos;
  - aprobación visual de la usuaria.
- **Estado final:** ✅ Cumplido. Criterios automáticos en verde y, tras una iteración de diseño con feedback de la usuaria, se entregó con commit y merge a `main` a su pedido.

## 1. Diagnóstico
- La UI usaba MUI sin tema propio. El título decía "MichiCode hola", la pestaña "React App" y el HTML estaba en `lang="en"`. Al copiar un enlace aparecía un `alert()` nativo.
- No había gatos ni sonidos.
- **Bug:** `GET /urls` devolvía campos en snake_case (`short_code`...), pero `UrlList` esperaba camelCase. Por eso el historial de URLs mostraba enlaces vacíos.
- **Deuda del Sprint 1:**
  - dos advertencias `react-hooks/exhaustive-deps` que rompían el build en CI;
  - 0 tests;
  - `docker-compose.prod.yml` usaba `BASE_URL`, pero el código lee `PUBLIC_URL_HOST`.
- **Privacidad:** la descarga del QR enviaba el contenido a un servicio externo (`api.qrserver.com`).

## 2. Roles utilizados
| Rol | Por qué se activó | Roadmap consultado |
| --- | --- | --- |
| UX / Product Design | Rediseño visual, identidad "michi", jerarquía y accesibilidad | https://roadmap.sh/ux-design |
| Frontend | Tema MUI, ilustraciones SVG, motor de audio, refactor de hooks | https://roadmap.sh/frontend · https://roadmap.sh/react |
| QA | Tests de frontend y backend, build limpio en CI, capturas | https://roadmap.sh/qa |
| Backend / DevOps (menor) | Contrato de `/urls` y variable de producción | https://roadmap.sh/backend |

## 3. Decisiones
| Decisión | Alternativas | Motivo |
| --- | --- | --- |
| Maullidos sintetizados con Web Audio API (6 tipos) | Grabaciones `.mp3` | Elegido por la usuaria: sin archivos, sin licencias y funciona sin conexión |
| Un único listener global (captura) para cualquier clic | Llamar a `meow()` en cada `onClick` | Cubre cualquier elemento actual o futuro sin tocarlo; `data-no-meow` excluye zonas (silencio, gatos con voz propia) |
| No repetir el tipo anterior y variar el tono ±10% | Azar puro | Cada clic suena distinto |
| Botón de silencio persistente (`localStorage`, con try/catch) | Siempre con sonido | Accesibilidad y respeto al usuario |
| Gatos en SVG propios | Imágenes o stock | Sin dependencias ni licencias; escalan y se animan con CSS |
| Animaciones que respetan `prefers-reduced-motion` | Animar siempre | Accesibilidad |
| QR en PNG generado en el navegador (SVG a canvas) | Seguir usando `api.qrserver.com` | No se envía el contenido a terceros y funciona sin conexión |
| DTO camelCase en el backend (`toUrlDto`) | Adaptar el frontend a snake_case | `/shorten` ya devolvía camelCase; se unifica el contrato |
| Tests del backend con `node:test` + `tsx` | jest / supertest | No requiere instalar dependencias nuevas |

## 4. Tareas
| # | Tarea | Rol | Verificación | Estado |
| --- | --- | --- | --- | --- |
| 1 | Tema MUI (paleta violeta/rosa, Nunito, bordes redondeados, botones con degradado) | UX + Frontend | Capturas | ✅ |
| 2 | Tres gatos kawaii que pasean en franjas propias con rutinas de gato, y fondo de huellitas (ver §8.1) | Frontend | Capturas, galería de poses y test de render | ✅ |
| 3 | Motor de maullidos (`src/sound/meow.ts`): cualquier clic maúlla y cada gato tiene su voz; globo y botón de silencio | Frontend | `meow.test.ts` (9 tests) + `App.test.tsx` (2) | ✅ |
| 4 | Pulido: quitar "hola", título, `lang="es"`, manifest y Snackbar en vez de `alert()` | Frontend | `App.test.tsx` | ✅ |
| 5 | Deuda técnica: lint, bug de `/urls`, `PUBLIC_URL_HOST` en prod, QR local y tests del backend | QA + Backend | `verify.py` | ✅ |
| 6 | Reconstruir contenedores y probar de punta a punta | QA | `curl` + capturas | ✅ |

## 5. Cambios realizados
| Archivo | Cambio |
| --- | --- |
| `frontend/src/theme.ts` | Nuevo tema MUI |
| `frontend/src/sound/meow.ts` | Nuevo motor de maullidos: corto, largo, pregunta, trino, quejido y ronroneo |
| `frontend/src/components/cats/Kitty.tsx`, `CatLane.tsx`, `Illustrations.tsx` | Gatos kawaii con poses, franjas de paseo y ovillo y caja (reemplazan el `Cats.tsx` de la primera entrega) |
| `frontend/src/components/SoftCard.tsx` | Tarjeta translúcida sin orejas |
| `frontend/src/components/MuteToggle.tsx` | Nuevo botón para silenciar o activar los maullidos |
| `frontend/src/App.tsx` | `ThemeProvider`, `CssBaseline`, instala el listener de maullidos y quita el `Container` duplicado |
| `frontend/src/pages/Home.tsx` | Título sin "hola", chips, tres franjas de paseo (`CatLane`) y pie de página |
| `frontend/src/components/*.tsx` | Rediseño con `SoftCard`, estados vacíos con caja de cartón, ovillo, Snackbar y QR generado en el navegador |
| `frontend/src/hooks/useFetch.ts` | Opciones guardadas en una `ref` (corrige la advertencia de lint) y URL por defecto de la API |
| `frontend/src/index.css` | Fondo de huellitas y animaciones `kitty-*` (caminar, lamerse, acicalarse, bostezar, estirarse, manotazos, salto, dormir, láser, corazones) |
| `frontend/public/index.html`, `manifest.json` | `lang="es"`, título, fuente Nunito y colores |
| `frontend/src/**/*.test.ts(x)` | Tests nuevos: `meow.test.ts` y `App.test.tsx` |
| `backend/src/services/urlService.ts` | `toUrlDto` usado en `/shorten` y `/urls`; exporta `isValidHttpUrl` |
| `backend/src/__tests__/url.test.ts`, `package.json`, `tsconfig.json` | Tests con `node:test`, script `test` y tests excluidos del build |
| `docker-compose.prod.yml`, `README.md` | `BASE_URL` renombrada a `PUBLIC_URL_HOST` |

## 6. Pruebas y resultados
- `verify.py`: backend build ✅, backend test ✅ (3/3), frontend build ✅ con `CI=true` y 0 advertencias (antes fallaba), frontend test ✅ (11/11).
- Docker: backend y frontend reconstruidos.
  - `GET /`: 200, con `lang="es"` y título nuevo.
  - `POST /shorten`: 201.
  - `GET /urls` devuelve `shortCode, originalUrl, shortUrl, clicks, createdAt`.
- Capturas con Edge sin interfaz a 1366px y 500px: sin desbordes; los gatos quedan en sus franjas sin tapar tarjetas.

## 7. Problemas encontrados
- **Keys duplicadas:** el globo y el contenedor del gato compartían `key` y React avisaba en los tests. Se les pusieron prefijos distintos.
- **Mancha de corazón desplazada:** aplicar `transform-box: fill-box` a todos los grupos del SVG movía el corazón. Se limitó a las piezas animadas.
- **Cola y patita ocultas:** al lamerse o acicalarse quedaban detrás de la cabeza. Se dibujan copias delante, visibles solo en esas acciones.
- **Mock de axios:** CRA usa `resetMocks`, que borra las implementaciones de `jest.fn`. Se usaron funciones simples en el mock.
- **`borderRadius`:** con `shape.borderRadius=16`, MUI multiplica los números. Se usan valores en px.
- **Capturas:** Edge sin interfaz no permite ventanas de menos de 500px y no ejecuta JS dentro de iframes en modo screenshot. La vista móvil se validó a 500px.

## 8. Feedback del usuario
Primera entrega, rechazada en lo visual:
- los gatos no eran lo bastante tiernos;
- las huellas del fondo no parecían de gato;
- no le gustaban las orejas en las tarjetas.

Pidió:
- tres gatos kawaii con ojos muy grandes:
  - una gata blanca con una mancha atigrada en forma de corazón y algunas manchitas más;
  - un gato negro;
  - un gato gris con blanco;
- que paseen por la página haciendo cosas de gato (lamerse la cola, jugar con un ovillo, perseguir un láser…) sin tapar los recuadros;
- que cualquier clic maúlle, también al hacer clic en los gatos;
- al terminar, commit, push y merge a `main`.

## 8.1 Iteración tras el feedback
| Cambio | Detalle |
| --- | --- |
| Gatos nuevos (`cats/Kitty.tsx`) | Estilo kawaii: cabeza grande y ojos enormes con iris de color y dos brillos. **Corazón** (blanca, corazón atigrado con rayas, manchas en oreja, lomo, pata y punta de cola, ojos azules), **Noche** (negro, ojos ámbar) y **Nube** (gris con hocico, pecho, patitas y punta de cola blancos, ojos verdes). Tres poses: de pie, sentado y enroscado. |
| Paseos (`cats/CatLane.tsx`) | Cada gato tiene su propia franja de paseo, dentro del flujo de la página (bajo el título, entre herramientas e historial, y antes del pie). Así nunca tapa los recuadros. Rutina aleatoria: camina, se lame la cola, se acicala, bosteza, se estira, duerme, juega con un ovillo que rueda y persigue un punto láser saltando sobre él. |
| Maullidos | Cualquier clic en la página maúlla (`installMeowOnClicks`), y lo dice uno de los tres gatos con globo y saltito. Al hacer clic en un gato maúlla ese gato con su propia voz (Corazón más aguda, Nube más grave) y le salen corazones. También funciona con teclado (Enter o espacio). |
| Fondo | Huellitas de gato reales: almohadilla con tres lóbulos y cuatro deditos, en dos rotaciones. |
| Tarjetas | Se quitaron las orejas (`SoftCard`). Los estados vacíos usan una caja de cartón y el generador de QR un ovillo, para que solo haya tres gatos. |
| Accesibilidad | Cada gato es un botón con nombre y descripción. Con `prefers-reduced-motion` no caminan: solo se sientan y duermen. |

**Verificación:**
- `verify.py` en verde: tests del frontend 11/11, incluido que al hacer clic en un gato maúlla ese gato y que cualquier clic lo dice uno de los tres.
- Galería renderizada de las 3 × 8 poses para revisar el dibujo.
- Capturas a 1366 px y 500 px: los gatos quedan en sus franjas y no tapan tarjetas.

## 9. Próximos pasos
- Modo oscuro (el tema ya centraliza los colores).
- Tests de integración del backend contra Mongo en memoria (requiere instalar dependencias).
- Quitar `tailwindcss`, `postcss` y `autoprefixer` de `devDependencies` si no se van a usar.
