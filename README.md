# Norma Ventas

PWA de catálogo y ventas (React 19 + Vite + Supabase).

## Puesta en marcha

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
1. Crea un proyecto en https://supabase.com
2. En **SQL Editor**, pega y ejecuta el contenido completo de `supabase_schema.sql`.
3. En **Project Settings → API** copia la *Project URL* y la *anon public key*.
4. Edita el archivo `.env` y reemplaza los valores:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```
5. En **Authentication → Users → Add user** crea tu usuario vendedor (email + contraseña).

### 3. Correr en local
```bash
npm run dev
```
Abre la URL que muestra Vite (ej. http://localhost:5173).
- Vista de comprador: la URL directa.
- Panel de vendedor: inicia sesión con el usuario que creaste en Supabase.

### 4. Publicar (Vercel)
1. Sube el proyecto a GitHub (el `.env` NO se sube, ya está en `.gitignore`).
2. En https://vercel.com importa el repo. Detecta Vite automáticamente.
3. En **Settings → Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Te da una URL pública con HTTPS (necesaria para instalar la PWA en iPhone).

## Íconos PWA
Coloca en `public/` los archivos `icon-192.png`, `icon-512.png` y `og-image.png` (1200×630) con tu marca, o el ícono saldrá en blanco al instalar.

## Notas
- App de una sola tienda (el comprador anónimo no enruta por slug todavía).
- El descuento de stock al confirmar pedido ya es automático (trigger en el SQL).
# norma-ventas
