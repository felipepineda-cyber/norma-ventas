-- Proyecto Norma Ventas - Esquema de base de datos (Supabase / Postgres)
-- Ejecuta TODO este archivo en: Supabase -> SQL Editor -> New query -> Run
-- Es repetible: puedes correrlo varias veces sin que falle.

-- Extensiones
create extension if not exists "pgcrypto";


-- TABLAS -------------------------------------------------------------

-- Tienda (una por vendedor)
create table if not exists public.stores (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  emoji         text default 'shop',
  logo_a        text default '#3B2BFF',
  logo_b        text default '#7A4DFF',
  logo_url      text,
  sii           boolean default false,
  whatsapp      text,
  promo_eyebrow text default 'Ofertas de la semana',
  promo_title   text default 'Hasta 30% de descuento',
  promo_sub     text default 'En productos seleccionados',
  bank          jsonb default '{}'::jsonb,
  created_at    timestamptz default now(),
  unique (owner_id)
);
-- Para tiendas ya creadas: agrega la columna del logo si no existe
alter table public.stores add column if not exists logo_url text;

-- Producto
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  name          text not null,
  category      text default 'General',
  description   text default '',
  emoji         text default 'box',
  images        text[] default '{}',
  benefits      text[] default '{}',
  normal_price  integer not null,
  offer_pct     integer default 0,
  price         integer generated always as (
                  case when coalesce(offer_pct,0) > 0
                       then round(normal_price * (1 - offer_pct/100.0) / 10) * 10
                       else normal_price end
                ) stored,
  was           integer generated always as (
                  case when coalesce(offer_pct,0) > 0 then normal_price else null end
                ) stored,
  featured      boolean default false,
  top           boolean default false,
  active        boolean default true,
  is_new        boolean default true,
  rating        numeric(2,1) default 0,
  reviews_count integer default 0,
  sort_order    integer default 0,
  created_at    timestamptz default now()
);
create index if not exists idx_products_store on public.products(store_id);

-- Variante (color + talla + stock)
create table if not exists public.variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  color       text not null,
  hex         text default '#6B6B78',
  size        text not null default 'Unica',
  stock       integer default 0,
  unique (product_id, color, size)
);
create index if not exists idx_variants_product on public.variants(product_id);

-- Pedido
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores(id) on delete cascade,
  code              text not null,
  buyer_name        text,
  buyer_phone       text,
  total             integer not null,
  comprobante_path  text,
  payment_method    text default 'transferencia',
  status            text default 'Pago en revision',
  created_at        timestamptz default now()
);
create index if not exists idx_orders_store on public.orders(store_id);
-- Para pedidos ya creados: agrega la columna del método de pago si no existe
alter table public.orders add column if not exists payment_method text default 'transferencia';

-- Items del pedido
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text not null,
  color       text,
  size        text,
  qty         integer not null,
  unit_price  integer not null
);
create index if not exists idx_order_items_order on public.order_items(order_id);


-- ROW LEVEL SECURITY -------------------------------------------------
alter table public.stores      enable row level security;
alter table public.products    enable row level security;
alter table public.variants    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- STORES
drop policy if exists "stores_public_read"  on public.stores;
drop policy if exists "stores_owner_insert" on public.stores;
drop policy if exists "stores_owner_update" on public.stores;
create policy "stores_public_read"  on public.stores for select using (true);
create policy "stores_owner_insert" on public.stores for insert with check (owner_id = auth.uid());
create policy "stores_owner_update" on public.stores for update using (owner_id = auth.uid());

-- PRODUCTS
drop policy if exists "products_public_read"  on public.products;
drop policy if exists "products_owner_read"   on public.products;
drop policy if exists "products_owner_write"  on public.products;
drop policy if exists "products_owner_update" on public.products;
drop policy if exists "products_owner_delete" on public.products;
create policy "products_public_read" on public.products for select using (active = true);
create policy "products_owner_read"  on public.products for select
  using (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "products_owner_write" on public.products for insert
  with check (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "products_owner_update" on public.products for update
  using (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "products_owner_delete" on public.products for delete
  using (store_id in (select id from public.stores where owner_id = auth.uid()));

-- VARIANTS
drop policy if exists "variants_public_read"  on public.variants;
drop policy if exists "variants_owner_write"  on public.variants;
drop policy if exists "variants_owner_update" on public.variants;
drop policy if exists "variants_owner_delete" on public.variants;
create policy "variants_public_read" on public.variants for select using (true);
create policy "variants_owner_write" on public.variants for insert
  with check (product_id in (
    select p.id from public.products p join public.stores s on s.id = p.store_id
    where s.owner_id = auth.uid()));
create policy "variants_owner_update" on public.variants for update
  using (product_id in (
    select p.id from public.products p join public.stores s on s.id = p.store_id
    where s.owner_id = auth.uid()));
create policy "variants_owner_delete" on public.variants for delete
  using (product_id in (
    select p.id from public.products p join public.stores s on s.id = p.store_id
    where s.owner_id = auth.uid()));

-- ORDERS
drop policy if exists "orders_anyone_insert" on public.orders;
drop policy if exists "orders_owner_read"    on public.orders;
drop policy if exists "orders_owner_update"  on public.orders;
create policy "orders_anyone_insert" on public.orders for insert with check (true);
create policy "orders_owner_read"    on public.orders for select
  using (store_id in (select id from public.stores where owner_id = auth.uid()));
create policy "orders_owner_update"  on public.orders for update
  using (store_id in (select id from public.stores where owner_id = auth.uid()));

-- ORDER_ITEMS
drop policy if exists "items_anyone_insert" on public.order_items;
drop policy if exists "items_owner_read"    on public.order_items;
create policy "items_anyone_insert" on public.order_items for insert with check (true);
create policy "items_owner_read"    on public.order_items for select
  using (order_id in (
    select o.id from public.orders o join public.stores s on s.id = o.store_id
    where s.owner_id = auth.uid()));


-- STORAGE (buckets) --------------------------------------------------

-- Fotos de productos: lectura publica
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Comprobantes de transferencia: privado
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Logos de tienda: lectura publica
insert into storage.buckets (id, name, public)
values ('store-logos', 'store-logos', true)
on conflict (id) do nothing;

-- Politicas de storage
drop policy if exists "prodimg_public_read" on storage.objects;
drop policy if exists "prodimg_auth_write"  on storage.objects;
drop policy if exists "comp_anyone_insert"  on storage.objects;
drop policy if exists "comp_auth_read"      on storage.objects;
create policy "prodimg_public_read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "prodimg_auth_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');
create policy "comp_anyone_insert" on storage.objects for insert
  with check (bucket_id = 'comprobantes');
create policy "comp_auth_read" on storage.objects for select to authenticated
  using (bucket_id = 'comprobantes');

-- Logos de tienda: cualquiera lee, solo autenticados suben/cambian
drop policy if exists "storelogo_public_read" on storage.objects;
drop policy if exists "storelogo_auth_write"  on storage.objects;
drop policy if exists "storelogo_auth_update" on storage.objects;
create policy "storelogo_public_read" on storage.objects for select
  using (bucket_id = 'store-logos');
create policy "storelogo_auth_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'store-logos');
create policy "storelogo_auth_update" on storage.objects for update to authenticated
  using (bucket_id = 'store-logos');


-- DESCUENTO DE STOCK AL CONFIRMAR (recomendado para vender) ----------
-- Resta el stock de la variante exacta (producto + color + talla) cuando
-- entra un item de pedido, en el servidor. Evita vender más de lo que hay.
-- No bloquea la compra si la variante no calza: solo no descuenta.
create or replace function public.decrement_variant_stock()
returns trigger language plpgsql security definer as $$
begin
  update public.variants v
     set stock = greatest(0, v.stock - new.qty)
   where v.product_id = new.product_id
     and v.color = new.color
     and v.size  = coalesce(new.size, 'Unica');
  return new;
end; $$;
drop trigger if exists trg_decrement_stock on public.order_items;
create trigger trg_decrement_stock
  after insert on public.order_items
  for each row execute function public.decrement_variant_stock();


-- SEED OPCIONAL ------------------------------------------------------
-- Descomenta DESPUES de crear tu usuario. Reemplaza TU-USER-UUID por
-- el id de tu usuario (Authentication -> Users).
--
-- insert into public.stores (owner_id, name, emoji, sii, whatsapp, bank)
-- values ('TU-USER-UUID', 'GamerStock CL', 'game', true, '56912345678',
--   '{"banco":"Banco Estado","tipo":"Cuenta Corriente","numero":"001234567","rut":"12.345.678-9","titular":"Felipe Rojas","correo":"ventas@gamerstock.cl"}')
-- on conflict (owner_id) do nothing;
