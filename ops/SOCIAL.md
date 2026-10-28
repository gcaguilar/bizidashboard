# Agente social diario (Instagram)

Runbook operativo del servicio `social-zaragoza`. El agente es determinista (sin
LLM ni aprobación humana): construye cuatro publicaciones en español a partir de
las lecturas de analítica, las renderiza con Resvg, sube los JPEG a tmpfiles.org,
los publica con Buffer (`shareNow`) y guarda el resultado en un SQLite local. El
código vive en `src/lib/social/*` (dominio puro y adaptadores de media/Buffer),
`src/jobs/social/*` (lectura de datos y ensamblado de cada slot),
`src/jobs/social-standalone.ts` (cron) y `scripts/start-social.mjs` (health server).
Postgres solo se lee; el estado operativo nunca se escribe en Postgres.

## Variables de entorno

| Variable | Defecto | Notas |
| :--- | :--- | :--- |
| `SOCIAL_ENABLED` | `false` | En producción debe ser `1`. El compose usa `${SOCIAL_ENABLED:-false}` para que un `docker compose up` normal no arranque el servicio sin claves. |
| `SOCIAL_CITY` | `zaragoza` | Debe coincidir con `CITY`; el arranque falla si no. |
| `SOCIAL_TIMEZONE` | `Europe/Madrid` | Debe ser `Europe/Madrid`; las ventanas de analítica están fijadas a esa zona y el arranque falla con otra. |
| `SOCIAL_STATE_DB` | `/app/data/social.sqlite` | SQLite del volumen `social-state`. |
| `SOCIAL_DRY_RUN` | `0` | `1` construye el post y lo registra como `skipped` (`dry_run`); no sube ni publica. |
| `SOCIAL_CATCHUP_MINUTES` | `120` | Ventana de recuperación al arrancar. |
| `BUFFER_API_KEY` | vacío | Clave privada de Buffer. Obligatoria salvo dry run. |
| `BUFFER_CHANNEL_ID` | vacío | Canal de Instagram dentro de Buffer. |
| `TMPFILES_EXPIRE_SECONDS` | `7200` | Caducidad de las imágenes (2 h). |
| `SOCIAL_IMAGE_HOST` | `tmpfiles` | Reservado para un futuro host alternativo. |

`SOCIAL_ENABLED=1` sin `BUFFER_API_KEY`/`BUFFER_CHANNEL_ID` (y sin dry run) hace
fallar el arranque a propósito: es un error de configuración, no un bucle sano.

La imagen del servicio es `social.Dockerfile`, con un `CMD` único
(`bun scripts/start-social.mjs`): no existe variable que elija entre el proceso
social y el de jobs. Tampoco ejecuta `prisma migrate deploy`; las migraciones
las aplican los contenedores web/jobs.

## Horarios (Europe/Madrid)

| Slot | Cron | Contenido | Monitor Sentry |
| :--- | :--- | :--- | :--- |
| `morning` | `30 8 * * *` | Story diaria de mañana | `social-morning` |
| `afternoon` | `30 18 * * *` | Story diaria de tarde | `social-afternoon` |
| `weekly` | `0 9 * * 1` | Carrusel semanal de distritos (5 láminas) | `social-weekly` |
| `monthly` | `0 10 1 * *` | Carrusel del informe mensual (5 láminas) | `social-monthly` |

Todos usan `runOnInit: false`. Al arrancar, el proceso recupera un slot perdido
solo si sigue dentro de `SOCIAL_CATCHUP_MINUTES` (120 min por defecto) después
de su hora. Un slot ya `sent`, `skipped` o `error` no se repite.

## Estado local y catch-up

El SQLite (`social_posts`, una fila por `date_key` + `slot`) es la fuente de
verdad operativa. La secuencia normal es `claimed → rendering → uploading →
publishing → sent`; los fallos terminan en `skipped` o `error`. El proceso es de
**una sola réplica** (`replicas: 1`), porque SQLite no se comparte entre
réplicas.

`claimSlot` recupera una fila activa abandonada después de 15 minutos, salvo si
está en `publishing`. Ese estado significa que Buffer pudo aceptar el post antes
de que el proceso muriera; republicar podría duplicarlo. La fila se deja intacta
y el runner emite `social.stale_publishing_requires_review` y un evento de
Sentry con área `jobs.social`. La resolución es manual (ver más abajo).

## Política de fallos

- Snapshot viejo (> 10 min), última hora completa vieja (> 2 h), informe
  mensual no listo o datos insuficientes: se registra `skipped`, se reporta a
  Sentry y no se publica nada con datos de relleno. En las stories diarias se
  exigen ambas frescuras porque los distritos y las anomalías salen del rollup
  horario.
- Fallo de tmpfiles (subida o preflight), de Buffer o del render: se registra
  `error`, se reporta a Sentry y no se reintenta automáticamente.
- Nunca se publican datos obsoletos ni se inventan cifras. Los umbrales y el
  copy están bloqueados en el código.
- Para reintentar un slot `error`/`skipped` hay que resolver la causa y borrar o
  mover manualmente la fila (decisión humana), ya que el estado terminal no se
  reclama solo.

## Alertas en Sentry

El código emite los cuatro cron monitors (`social-morning`, `social-afternoon`,
`social-weekly`, `social-monthly`) y captura excepciones con área
`jobs.social`. **Falta crear en Sentry la regla de alerta** sobre esos monitores
(check-in perdido y fallo de cron). No hay webhook ni email en el código: sin la
regla, los fallos quedan registrados pero nadie recibe aviso.

## tmpfiles.org: caducidad y condiciones

Las imágenes se suben con `expire=7200` (2 h). La API devuelve la **página**
del fichero, no el JPEG: el adaptador descarga esa página, extrae el enlace
directo real (`https://tmpfiles.org/dl/{token}/{id}/{name}`) y lo valida. **No**
se puede construir `/dl/{id}/{name}` a mano: sin el token, tmpfiles redirige a
la página HTML. Antes de llamar a Buffer se hace un preflight que exige HTTP
200, `content-type: image/jpeg`, un tamaño mínimo y la firma JPEG. Si el
preflight falla, el post se descarta.

Limitaciones a asumir:

- La URL es pública y efímera. Buffer la descarga al publicar; no sirve como
  archivo permanente.
- Disponibilidad, límites de uso y condiciones de tmpfiles.org son de terceros y
  pueden cambiar. Si el servicio deja de aceptar subidas o el preflight falla,
  el agente se salta la publicación en lugar de publicar una imagen rota.
- No se debe usar tmpfiles para contenido que requiera persistencia o privacidad.

## Descubrir el canal de Buffer

Con una clave válida, el script de solo lectura lista organizaciones y canales:

```bash
BUFFER_API_KEY=... bun run social:discover
```

Copia el id del canal de Instagram en `BUFFER_CHANNEL_ID` y reinicia el servicio.
El script no publica nada.

## Preview local

```bash
bun run social:preview --slot morning
bun run social:preview --slot weekly --date 2026-10-26
bun run social:preview --slot monthly --date 2026-11-01 --out .tmp/social
```

Escribe las imágenes en `.tmp/social` por defecto (ignorado por git), imprime
titular, caption y alt text, y **no** sube a tmpfiles, no llama a Buffer y no
toca el SQLite de estado. Necesita Postgres para las lecturas de analítica y el
GeoJSON de distritos. `--date` fija el reloj del slot, de modo que las ventanas
semanal/mensual y el baseline horario se calculan respecto a esa fecha.

## Rotar la clave de Buffer

1. En Buffer, crea una clave nueva (Settings → API) sin revocar la anterior.
2. Actualiza `BUFFER_API_KEY` en el gestor de secretos/entorno de producción.
3. Redespliega o reinicia solo el servicio:
   `docker compose up -d social-zaragoza`.
4. Comprueba un `social:discover` o un dry run y que el health server responde.
5. Revoca la clave antigua en Buffer.

Nunca escribas la clave en el repositorio ni en los logs. El adaptador no la
imprime.

## Resolver un slot atascado en `publishing`

Síntoma: la fila lleva más de 15 minutos en `publishing` y el runner registra
`social.stale_publishing_requires_review`.

1. **Comprueba Buffer** (bandeja/canal de Instagram) para ese `date_key` y
   `slot`. Busca la publicación por hora y caption.
2. Si Buffer la aceptó, marca la fila como enviada con el id real. Si no la
   aceptó, márcala como `error`; el estado terminal evita republicaciones
   automáticas.
3. No borres la fila salvo que quieras permitir explícitamente un nuevo claim.

Inspecciona el estado (ejecuta el comando fuera de la ventana del slot; SQLite
usa WAL y `busy_timeout`, pero es un único escritor):

```bash
docker compose exec social-zaragoza bun -e '
import { Database } from "bun:sqlite";
const db = new Database("/app/data/social.sqlite");
console.log(db.query("SELECT id, date_key, slot, status, updated_at, buffer_post_id FROM social_posts ORDER BY id DESC LIMIT 20").all());
'
```

Si el contenedor no está en marcha, levántalo primero
(`docker compose up -d social-zaragoza`) para poder ejecutar el comando.

Cierra el caso como enviado (sustituye `ID`, `BUFFER_POST_ID` y la fecha UTC):

```bash
docker compose exec social-zaragoza bun -e '
import { Database } from "bun:sqlite";
const db = new Database("/app/data/social.sqlite");
db.query("UPDATE social_posts SET status = ?, buffer_post_id = ?, published_at = ?, updated_at = ?, error = NULL WHERE id = ?")
  .run("sent", "BUFFER_POST_ID", "2026-10-27T08:31:00.000Z", "2026-10-27T08:31:00.000Z", ID);
'
```

O ciérralo como error si Buffer no lo publicó:

```bash
docker compose exec social-zaragoza bun -e '
import { Database } from "bun:sqlite";
const db = new Database("/app/data/social.sqlite");
db.query("UPDATE social_posts SET status = ?, error = ?, updated_at = ? WHERE id = ?")
  .run("error", "manual_review: no publicado en Buffer", "2026-10-27T08:35:00.000Z", ID);
'
```

Si de verdad hay que republicar, es una decisión manual: borra la fila
`(date_key, slot)` y deja que el siguiente catch-up/slot la reclame, o fuerza el
slot desde el contenedor. Antes de borrar, confirma en Buffer que no existe ya la
publicación.

## Prueba de contrato antes de producción

Con `SOCIAL_ENABLED=false` (o en local, sin cron):

1. Renderiza un preview de story y otro de carrusel:
   `bun run social:preview --slot morning` y
   `bun run social:preview --slot weekly --date <lunes>`.
2. Sube manualmente los JPEG a tmpfiles con `expire=7200` y verifica en incógnito
   que el enlace directo con token (`/dl/{token}/{id}/{name}`) devuelve
   `image/jpeg` y un tamaño razonable. El script de preview no sube nada; para
   el contrato, usa el adaptador real o copia el enlace desde la página.
3. Crea en Buffer una story con `shareNow` contra el canal de producción (o un
   borrador si el canal lo permite) y confirma que aparece.
4. Repite con las 5 láminas del carrusel y su caption/alt text.
5. Solo entonces define `SOCIAL_ENABLED=1` en producción y despliega el
   servicio. La primera ejecución real debe vigilarse en Sentry y en el canal.
