# Plataforma de videoconferencias

Frontend en React + Vite para videollamadas con WebRTC, chat en sala y sincronizacion de estados de audio/video mediante Socket.IO.

## Requisitos
- Node.js 18 o superior (npm incluido).
- Acceso a la API y servidores de senalizacion/voz que se detallan abajo.

## Instalacion y arranque rapido
1) Instala dependencias:
```bash
npm install
```
2) Crea `.env.local` con las URLs de tu API y sockets (ejemplo mas abajo).
3) Inicia el entorno de desarrollo:
```bash
npm run dev
```
4) Abre `http://localhost:5173`.

### Scripts utiles
- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de produccion en `dist`.
- `npm run preview` — sirve localmente el build de produccion.

## Configuracion de entorno (resumen)
- API REST: `VITE_API_BASE_URL` (o `VITE_API_BASE_URL_LOCAL` / `VITE_API_BASE_URL_PROD`).
- Senalizacion de video: `VITE_VIDEO_SOCKET_URL`.
- STUN/TURN: `VITE_STUN_URL`, `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`, `VITE_FORCE_TURN` o `VITE_FORCE_RELAY`.
- Chat: `VITE_CHAT_SOCKET_URL`.
- Voz: `VITE_VOICE_SOCKET_URL`, `VITE_VOICE_FORCE_POLLING` (si un proxy bloquea WebSocket).

Tras modificar `.env`, reinicia `npm run dev` para que Vite lea los cambios.

### Ejemplo rapido de `.env.local` (desarrollo)
```env
# API REST
VITE_API_BASE_URL_LOCAL=http://localhost:8080/api/v1

# Senalizacion de video (WebRTC)
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
```

## Flujo de reuniones (como usar)
1) Crea u obtiene un ID de reunion desde la UI (pantalla "Crear reunion") o via API (`POST /meetings`).
2) Ingresa a la ruta de la sala con ese ID. `MeetingRoomPage` valida sesion y carga la reunion (`GET /meetings/:id`) y tu perfil (`/users/profile`).
3) El frontend abre el socket de senalizacion y envia `join:room` con tu `userId/displayName`.
4) Se negocian conexiones WebRTC con cada participante (offers/answers/candidates) y se sincronizan estados de audio/video/pantalla.
5) El chat en sala y los indicadores de medios llegan por eventos de Socket.IO desde el backend de senalizacion.
6) Al salir, se cierran sockets, peers y tracks locales y se navega fuera de la sala.

## Arquitectura (breve)
- React + Vite para la UI.
- API REST para autenticacion, perfiles y reuniones.
- Socket.IO para senalizacion WebRTC (video/chat/estados).
- Socket.IO de voz opcional si deseas audio separado.
- Tokens en `localStorage` (`videomeet_id_token`), enviados como `Authorization: Bearer`.

## Prerrequisitos de backend
- Servidor de senalizacion de video (`eisc-video`) corriendo (por defecto en 9000) y con `ORIGIN` incluyendo la URL del frontend.
- Servidor de voz (si aplica) en `VITE_VOICE_SOCKET_URL`.
- API REST accesible en `VITE_API_BASE_URL*`.
- Si el frontend usa HTTPS, usa `https://`/`wss://` en sockets (excepto localhost).
- Arranque tipico de senalizacion (`eisc-video`): `npm install`, `npm run dev` (watch) o `npm run build && npm start` (prod). Configura su `.env` con `PORT`, `ORIGIN`, `MAX_ROOM_SIZE`, `AUTH_SECRET` (opcional JWT HS256) y `REDIS_URL` para escalar.

## Registro (/register) — estado actual
- Pantalla solo frontend (sin backend real). Valida nombre, apellido, edad (>=13), email, contrasena fuerte y coincidencia de confirmacion. El boton se habilita solo cuando todo es valido. El envio simula carga y muestra un aviso.

## Solucion de problemas
- Permisos: si no hay audio/video, revisa permisos de camara/microfono del navegador.
- CORS/origenes: `ORIGIN` en senalizacion y la API deben permitir la URL del frontend.
- WebSocket bloqueado: usa `VITE_VOICE_FORCE_POLLING=true` o ajusta `https/wss`.
- NAT estrictos: agrega un servidor TURN propio si los pares no conectan.

## Notas
- Instala dependencias antes de cualquier script.
- Tras tocar `.env`, reinicia el servidor de desarrollo.
