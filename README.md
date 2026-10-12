# Yeyo API

Express 5 + Mongoose + TypeScript. Se despliega en Vercel como función serverless.

## Setup local

```bash
pnpm install
cp .env.example .env         # rellenar DB_URI, JWT_SECRET, ADMIN_PASSWORD
pnpm dev                     # http://localhost:8100
```

Smoke:

```bash
curl http://localhost:8100/
curl http://localhost:8100/api/health
curl -X POST http://localhost:8100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yeyo.dev","password":"..."}'
```

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | ts-node-dev con recarga |
| `pnpm build` | `tsc` → `dist/` |
| `pnpm start` | `node dist/index.js` |
| `pnpm seed:admin` | crea/actualiza la cuenta admin desde `.env` |
| `pnpm format` | prettier |

## Endpoints

Todo cuelga de `/api` (`src/routes/index.ts`).

- `GET /` → alive
- `GET /api/health` → `{ ok, db, uptime }`
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/auth/me` → `{ user }` (Bearer)
- `PUT /api/auth/password` → `{ user }` (Bearer) body `{ current, next }`

## Deploy a Vercel

- `api/index.ts` — entrada serverless: conecta Mongo, siembra admin y delega en la app Express.
- `vercel.json` — todo el tráfico se reescribe a `/api`.

Variables de entorno (Vercel → Project → Settings → Environment Variables): las mismas de `.env.example`.

```bash
vercel --prod
```

## Solicitudes de clientes (`/api/leads`)

Los tres mundos de yeyo.dev mandan su formulario a `POST /api/leads`. Cada solicitud:

1. Se guarda en Mongo (colección `leads`, estado `nuevo`).
2. Le llega al cliente un **correo de confirmación** (Resend) con el resumen de lo que pidió y los botones de WhatsApp e Instagram por si está apurado. Si responde ese correo, la respuesta llega a `CONTACT_EMAIL`.
3. Te llega un **mensaje a Telegram** con todo: nombre, contacto, negocio, qué necesita, el problema, presupuesto, urgencia (🔥 si es urgente o +$8k), de qué versión llegó, y botones para escribirle por WhatsApp y marcarlo como contactado.
4. Si a las `FOLLOW_UP_AFTER_HOURS` (48 h) sigue en `nuevo`, el cron le manda un **correo de seguimiento** y te avisa por Telegram.

Protecciones: honeypot (`website`), límite de 5 envíos por IP cada 10 min y validación de campos.

### Ponerlo en producción

1. **Telegram:** crea un bot con [@BotFather](https://t.me/BotFather) → `TELEGRAM_BOT_TOKEN`. Escríbele cualquier cosa al bot y abre `https://api.telegram.org/bot<TOKEN>/getUpdates`; el `chat.id` es tu `TELEGRAM_CHAT_ID`.
2. **Resend:** verifica el dominio `yeyo.dev` en Resend → `RESEND_API_KEY` y `RESEND_FROM_EMAIL="Yeyo <hola@yeyo.dev>"`. Sin dominio verificado Resend solo envía a tu propio correo.
3. **Mongo Atlas:** cluster gratis → `DB_URI`.
4. **Vercel:** `vercel --prod` y carga todas las variables de `.env.example`. Pon `API_PUBLIC_URL` con la URL final (activa el botón "✅ Marcar como contactado") y un `CRON_SECRET` largo; el cron de `vercel.json` corre todos los días a las 10:00 (Ecuador).
5. **Frontend (Netlify):** variable `VITE_API_URL=<url de Vercel>` y redeploy.

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/leads` | público (formulario) |
| GET | `/api/leads/:id/contacted?token=…` | enlace firmado desde Telegram |
| GET | `/api/leads?page=&status=` | admin (Bearer) |
| PATCH | `/api/leads/:id/status` | admin — `{ status: "nuevo" \| "contactado" \| "cerrado" \| "descartado" }` |
| GET | `/api/cron/lead-followups` | `Authorization: Bearer CRON_SECRET` |
