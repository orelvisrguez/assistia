# QR Attendance System

Sistema de gestión de asistencia académica con códigos QR dinámicos y seguros.

## Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Estilos**: Tailwind CSS + Shadcn/UI + Framer Motion
- **Backend**: Server Actions + API Routes
- **Base de Datos**: PostgreSQL (Neon.tech)
- **ORM**: Drizzle ORM
- **Autenticación**: NextAuth.js v5

## Configuración

1. Clona el repositorio
2. Instala dependencias:
   ```bash
   npm install
   ```

3. Configura variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Completa las variables en `.env`

4. Ejecuta migraciones:
   ```bash
   npm run db:push
   ```

5. (Opcional) Ejecuta el seed:
   ```bash
   npx tsx scripts/seed.ts
   ```

6. Inicia el servidor:
   ```bash
   npm run dev
   ```

## Credenciales Demo

- **Admin**: admin@demo.com / admin123
- **Profesor**: profesor@demo.com / prof123
- **Estudiante**: estudiante1@demo.com / student123

## Seguridad del QR

El sistema utiliza tokens TOTP (Time-based One-Time Password) que:
- Cambian cada 10 segundos
- Están encriptados con AES-256-GCM
- Validan la sesión activa
- Opcionalmente verifican geolocalización

## Licencia

MIT
