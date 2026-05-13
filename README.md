# Pet Store

Aplicación web modular para administración de catálogo, stock, ventas, carritos, pedidos y domicilios por roles.

## Stack

- Next.js + TypeScript
- Prisma ORM
- PostgreSQL, listo para Neon
- JWT en cookies HTTP-only
- bcryptjs para contraseñas
- Recharts para dashboard
- Configuración de Vercel incluida

## Arquitectura

```text
src/
  app/                 rutas Next.js y API routes
  modules/
    auth/              registro, login y sesiones
    products/          catálogo, filtros y CRUD base
    cart/              carrito de cliente
    orders/            pedidos y estados
    admin/             dashboard administrativo
    deliveries/        flujo del repartidor
    customer/          historial del cliente
  shared/
    components/        UI reutilizable
    lib/               prisma, auth, errores, dinero, slug
    types/             contratos compartidos
prisma/
  schema.prisma        modelo relacional
  seed.ts              datos iniciales
```

## Entorno local

1. Instala dependencias:

```bash
npm install
```

2. Copia variables:

```bash
cp .env.example .env
```

3. Configura `DATABASE_URL`. Puedes usar Neon o el PostgreSQL local de `docker-compose.yml`.

4. Crea tablas y datos demo:

```bash
npm run prisma:migrate
npm run db:seed
```

5. Inicia desarrollo:

```bash
npm run dev
```

## Usuarios demo

Los usuarios se crean con `npm run db:seed` y pueden cambiarse desde `.env`:

- Admin: `admin@petstore.local` / `Admin123!`
- Repartidor: `repartidor@petstore.local` / `Repartidor123!`
- Cliente: `cliente@petstore.local` / `Cliente123!`

## Vercel

Configura estas variables en Vercel antes de desplegar:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_MINUTES`
- `REFRESH_TOKEN_DAYS`

El build command ya está definido en `vercel.json` como:

```bash
npm run vercel-build
```

Para producción, ejecuta migraciones con:

```bash
npm run prisma:deploy
```

No subas `.env` al repositorio.
