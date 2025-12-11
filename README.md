# Plataforma de videoconferencias

Frontend en React + Vite para videollamadas con WebRTC, chat en sala y sincronización de estados de audio/video mediante Socket.IO.

## Requisitos
- Node.js 18 o superior (npm incluido).
- Acceso a la API y a los servidores de señalización/voz que se detallan abajo.

## Instalación y arranque rápido
1) Instala dependencias:
   npm install
2) Crea `.env.local` con las URLs de tu API y sockets (ejemplo más abajo).
3) Inicia el entorno de desarrollo:
   npm run dev
4) Abre http://localhost:5173

### Scripts útiles
- npm run dev — servidor de desarrollo.
- npm run build — build de producción en `dist`.
- npm run preview — sirve localmente el build de producción.
- npm run docs — compila TypeScript a `.jsdoc-temp` y genera documentación estática en `docs/` (JSDoc).

## Configuración de entorno (resumen)
- API REST: `VITE_API_BASE_URL` (o `VITE_API_BASE_URL_LOCAL` / `VITE_API_BASE_URL_PROD`).
- Señalización de video: `VITE_VIDEO_SOCKET_URL`.
- STUN/TURN: `VITE_STUN_URL`, `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`, `VITE_FORCE_TURN` o `VITE_FORCE_RELAY`.
- Chat: `VITE_CHAT_SOCKET_URL`.
- Voz: `VITE_VOICE_SOCKET_URL`, `VITE_VOICE_FORCE_POLLING` (si un proxy bloquea WebSocket).

Tras modificar `.env`, reinicia `npm run dev` para que Vite lea los cambios.

### Ejemplo rápido de `.env.local` (desarrollo)
# API REST
VITE_API_BASE_URL_LOCAL=http://localhost:8080/api/v1

# Señalización de video (WebRTC)
VITE_VIDEO_SOCKET_URL=http://localhost:9000
VITE_STUN_URL=stun:stun.l.google.com:19302
# TURN opcional:
# VITE_TURN_URL=turn:tu-turn:3478
# VITE_TURN_USERNAME=usuario
# VITE_TURN_CREDENTIAL=clave
# VITE_FORCE_TURN=true

# Chat
VITE_CHAT_SOCKET_URL=http://localhost:3000

# Voz
VITE_VOICE_SOCKET_URL=http://localhost:3002
# VITE_VOICE_FORCE_POLLING=true

## Flujo de reuniones (cómo usar)
1) Crea u obtén un ID de reunión desde la UI (pantalla “Crear reunión”) o vía API (`POST /meetings`).
2) Ingresa a la ruta de la sala con ese ID. `MeetingRoomPage` valida sesión y carga la reunión (`GET /meetings/:id`) y tu perfil (`/users/profile`).
3) El frontend abre el socket de señalización y envía `join:room` con tu `userId/displayName`.
4) Se negocian conexiones WebRTC con cada participante (offers/answers/candidates) y se sincronizan estados de audio/video/pantalla.
5) El chat en sala y los indicadores de medios llegan por eventos de Socket.IO desde el backend de señalización.
6) Al salir, se cierran sockets, peers y tracks locales y se navega fuera de la sala.

## Arquitectura (breve)
- React + Vite para la UI.
- API REST para autenticación, perfiles y reuniones.
- Socket.IO para señalización WebRTC (video/chat/estados).
- Socket.IO de voz opcional si deseas audio separado.
- Tokens en `localStorage` (`videomeet_id_token`), enviados como `Authorization: Bearer`.

## Prerrequisitos de backend
- Servidor de señalización de video (`eisc-video`) corriendo (por defecto en 9000) y con `ORIGIN` incluyendo la URL del frontend.
- Servidor de voz (si aplica) en `VITE_VOICE_SOCKET_URL`.
- API REST accesible en `VITE_API_BASE_URL*`.
- Si el frontend usa HTTPS, usa `https://`/`wss://` en sockets (excepto localhost).
- Arranque típico de señalización (`eisc-video`): `npm install`, `npm run dev` (watch) o `npm run build && npm start` (prod). Configura su `.env` con `PORT`, `ORIGIN`, `MAX_ROOM_SIZE`, `AUTH_SECRET` (opcional JWT HS256) y `REDIS_URL` para escalar.

## Registro (/register) — estado actual
- Pantalla solo frontend (sin backend real). Valida nombre, apellido, edad (>=13), email, contraseña fuerte y coincidencia de confirmación. El botón se habilita solo cuando todo es válido. El envío simula carga y muestra un aviso.

## Documentación JSDoc
- Generada en `docs/` (abre `docs/index.html` o `docs/global.html` en el navegador).
- El build previo se guarda en `.jsdoc-temp/` (JS transpilado para que JSDoc resuelva tipos).

## Solución de problemas
- Permisos: si no hay audio/video, revisa permisos de cámara/micrófono del navegador.
- CORS/orígenes: `ORIGIN` en señalización y la API deben permitir la URL del frontend.
- WebSocket bloqueado: usa `VITE_VOICE_FORCE_POLLING=true` o ajusta a `https/wss`.
- NAT estrictos: agrega un servidor TURN propio si los pares no conectan.

## Notas
- Instala dependencias antes de cualquier script.
- Tras tocar `.env`, reinicia el servidor de desarrollo.
