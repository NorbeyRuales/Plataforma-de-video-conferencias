# Plataforma de videoconferencias

Aplicación frontend de una plataforma de videoconferencias construida con React y Vite.

## Requisitos previos

- Node.js 18 o superior instalado
- npm (incluido con Node) o pnpm/yarn si prefieres otro gestor de paquetes

## Puesta en marcha en local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Arrancar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

3. Abrir la aplicación en el navegador:

   - Normalmente Vite se levanta en `http://localhost:5173`

## Scripts disponibles

En `package.json` encontrarás, entre otros, estos scripts útiles:

- `npm run dev` - Inicia el servidor de desarrollo de Vite
- `npm run build` - Genera la versión de producción en la carpeta `dist`
- `npm run preview` - Sirve localmente el build de producción

## Flujo de registro (/register)

La pantalla de registro se encuentra en la ruta `/register` y por ahora es solo frontend (sin conexión real a backend).

### Campos del formulario

El formulario muestra estos campos:

- Nombre
- Apellido
- Edad
- Correo electrónico
- Contraseña
- Confirmar contraseña

### Validaciones en tiempo real

- **Nombre y Apellido**: obligatorios (no pueden ir vacíos).
- **Edad**:
  - Campo numérico (`type="number"`).
  - Se considera válida cuando es mayor o igual a 13 años.
  - Si es menor de 13, se muestra un tooltip rojo bajo el campo con el mensaje: `Debes tener al menos 13 años.`
- **Correo electrónico**:
  - Se valida con una expresión regular básica de email.
  - Si el formato es inválido, aparece un tooltip: `Introduce un correo electrónico válido.`
- **Contraseña**:
  - Se valida con un patrón fuerte: mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial.
  - Si es débil, se muestra un tooltip: `Usa 8 caracteres con mayúsculas, minúsculas y números.`
  - Además se muestra un panel de ayuda con las reglas de contraseña (`PasswordStrengthHint`).
- **Confirmar contraseña**:
  - Debe coincidir con la contraseña.
  - Si no coincide, aparece un tooltip rojo bajo el campo: `Las contraseñas deben coincidir.`
  - Cuando coinciden, se muestra un texto verde: `Las contraseñas coinciden.`

El botón **“Crear Cuenta”** permanece deshabilitado hasta que **todas** las validaciones anteriores son correctas.

### Estados de envío (simulados)

Actualmente no hay llamada real a un backend, pero el flujo de envío está simulado:

- Al enviar el formulario válido:
  - Se activa un estado de carga (`isSubmitting`).
  - El texto del botón cambia a `Creando cuenta…` durante ~1,5 segundos.
  - Después se muestra un toast informativo indicando que el registro real se conectará cuando exista el backend.

Cuando exista la API real, este mismo punto será donde se haga la llamada al endpoint de registro correspondiente, manteniendo la ruta de frontend en `/register`.

## Notas

- Asegúrate de tener las dependencias instaladas antes de ejecutar cualquier script.
