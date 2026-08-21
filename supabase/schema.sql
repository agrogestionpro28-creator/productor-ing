-- ============================================================
--  PRODUCTOR-ING — SCHEMA
--  Mismo proyecto Supabase que agro-ing (qxpmfhnsjvjbnnghhtuj)
--  Ejecutar en SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- PRODUCTORES (perfil propio — diferente de la tabla del ingeniero)
-- ------------------------------------------------------------
create table if not exists public.productores_perfil (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text not null,
  apellido      text,
  razon_social  text,
  cuit          text,
  telefono      text,
  email         text,
  localidad     text,
  -- Tipo de cambio configurable (ARS por USD)
  tipo_cambio   numeric(12,2) default 1000,
  moneda_pref   text default 'USD',  -- 'USD' o 'ARS'
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- STOCK DE GRANOS
-- ------------------------------------------------------------
create table if not exists public.stock_granos (
  id            uuid primary key default gen_random_uuid(),
  productor_id  uuid not null references public.productores_perfil(id) on delete cascade,
  campana       text not null,         -- '2026/2027'
  cultivo       text not null,         -- 'Soja', 'Maíz', etc.
  lote_nombre   text,                  -- referencia libre al lote
  fecha         date not null default current_date,
  tipo          text not null,         -- 'cosecha', 'venta', 'consumo', 'ajuste'
  cantidad_tn   numeric(12,3) not null,-- positivo=entrada, negativo=salida
  destino       text,                  -- 'silo_propio', 'acopio', 'venta_directa'
  acopio        text,                  -- nombre del acopio si aplica
  precio_usd    numeric(12,2),         -- precio por tn en USD
  precio_ars    numeric(12,2),         -- precio por tn en ARS
  observaciones text,
  created_at    timestamptz not null default now()
);
create index on public.stock_granos (productor_id);
create index on public.stock_granos (campana);

-- Vista: resumen de stock por cultivo/campaña
create or replace view public.vw_stock_granos as
select
  productor_id, campana, cultivo,
  sum(cantidad_tn) as stock_actual_tn,
  sum(case when tipo='cosecha' then cantidad_tn else 0 end) as cosechado_tn,
  sum(case when tipo='venta' then abs(cantidad_tn) else 0 end) as vendido_tn,
  sum(case when tipo='venta' and precio_usd is not null then abs(cantidad_tn)*precio_usd else 0 end) as ingreso_usd,
  sum(case when tipo='venta' and precio_ars is not null then abs(cantidad_tn)*precio_ars else 0 end) as ingreso_ars
from public.stock_granos
group by productor_id, campana, cultivo;

-- ------------------------------------------------------------
-- STOCK DE INSUMOS
-- ------------------------------------------------------------
create table if not exists public.stock_insumos (
  id            uuid primary key default gen_random_uuid(),
  productor_id  uuid not null references public.productores_perfil(id) on delete cascade,
  nombre        text not null,
  tipo          text not null,  -- 'agroquimico', 'semilla', 'fertilizante', 'otro'
  unidad        text not null,  -- 'lt', 'kg', 'bolsas', 'tn', 'unidad'
  fecha         date not null default current_date,
  movimiento    text not null,  -- 'entrada', 'salida'
  cantidad      numeric(12,3) not null,
  precio_usd    numeric(12,2),
  precio_ars    numeric(12,2),
  proveedor     text,
  lote_destino  text,           -- lote donde se aplicó (si es salida)
  cultivo       text,
  observaciones text,
  created_at    timestamptz not null default now()
);
create index on public.stock_insumos (productor_id);

-- Vista: stock actual por insumo
create or replace view public.vw_stock_insumos as
select
  productor_id, nombre, tipo, unidad,
  sum(case when movimiento='entrada' then cantidad else -cantidad end) as stock_actual,
  sum(case when movimiento='entrada' then cantidad*coalesce(precio_usd,0) else 0 end) as costo_total_usd,
  sum(case when movimiento='entrada' then cantidad*coalesce(precio_ars,0) else 0 end) as costo_total_ars
from public.stock_insumos
group by productor_id, nombre, tipo, unidad;

-- ------------------------------------------------------------
-- STOCK DE COMBUSTIBLE
-- ------------------------------------------------------------
create table if not exists public.stock_combustible (
  id            uuid primary key default gen_random_uuid(),
  productor_id  uuid not null references public.productores_perfil(id) on delete cascade,
  fecha         date not null default current_date,
  tipo          text not null,     -- 'gasoil', 'nafta'
  movimiento    text not null,     -- 'carga', 'consumo'
  litros        numeric(10,2) not null,
  precio_lt_usd numeric(10,4),
  precio_lt_ars numeric(10,4),
  equipo        text,              -- 'tractor', 'cosechadora', 'camion', 'otro'
  proveedor     text,
  observaciones text,
  created_at    timestamptz not null default now()
);
create index on public.stock_combustible (productor_id);

-- Vista: resumen combustible
create or replace view public.vw_stock_combustible as
select
  productor_id, tipo,
  sum(case when movimiento='carga' then litros else -litros end) as stock_lt,
  sum(case when movimiento='carga' then litros*coalesce(precio_lt_usd,0) else 0 end) as costo_usd,
  sum(case when movimiento='carga' then litros*coalesce(precio_lt_ars,0) else 0 end) as costo_ars
from public.stock_combustible
group by productor_id, tipo;

-- ------------------------------------------------------------
-- MOVIMIENTOS FINANCIEROS (para margen bruto)
-- ------------------------------------------------------------
create table if not exists public.movimientos (
  id            uuid primary key default gen_random_uuid(),
  productor_id  uuid not null references public.productores_perfil(id) on delete cascade,
  campana       text not null,
  fecha         date not null default current_date,
  tipo          text not null,   -- 'ingreso', 'egreso'
  categoria     text not null,   -- 'venta_granos', 'labor', 'insumo', 'combustible', 'arrendamiento', 'honorario_ing', 'otro'
  concepto      text not null,
  cultivo       text,
  lote          text,
  monto_usd     numeric(14,2),
  monto_ars     numeric(14,2),
  origen        text default 'manual',  -- 'manual', 'stock_granos', 'stock_insumos', 'stock_combustible'
  origen_id     uuid,            -- id del registro origen si aplica
  observaciones text,
  created_at    timestamptz not null default now()
);
create index on public.movimientos (productor_id);
create index on public.movimientos (campana);

-- Vista: margen bruto por cultivo/campaña
create or replace view public.vw_margen_bruto as
select
  productor_id, campana, cultivo,
  sum(case when tipo='ingreso' then coalesce(monto_usd,0) else 0 end) as ingresos_usd,
  sum(case when tipo='egreso'  then coalesce(monto_usd,0) else 0 end) as egresos_usd,
  sum(case when tipo='ingreso' then coalesce(monto_usd,0) else 0 end) -
  sum(case when tipo='egreso'  then coalesce(monto_usd,0) else 0 end) as margen_usd,
  sum(case when tipo='ingreso' then coalesce(monto_ars,0) else 0 end) as ingresos_ars,
  sum(case when tipo='egreso'  then coalesce(monto_ars,0) else 0 end) as egresos_ars,
  sum(case when tipo='ingreso' then coalesce(monto_ars,0) else 0 end) -
  sum(case when tipo='egreso'  then coalesce(monto_ars,0) else 0 end) as margen_ars
from public.movimientos
group by productor_id, campana, cultivo;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.productores_perfil  enable row level security;
alter table public.stock_granos        enable row level security;
alter table public.stock_insumos       enable row level security;
alter table public.stock_combustible   enable row level security;
alter table public.movimientos         enable row level security;

create policy "pp_own" on public.productores_perfil for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "sg_own" on public.stock_granos for all
  using (productor_id = auth.uid()) with check (productor_id = auth.uid());

create policy "si_own" on public.stock_insumos for all
  using (productor_id = auth.uid()) with check (productor_id = auth.uid());

create policy "sc_own" on public.stock_combustible for all
  using (productor_id = auth.uid()) with check (productor_id = auth.uid());

create policy "mv_own" on public.movimientos for all
  using (productor_id = auth.uid()) with check (productor_id = auth.uid());

-- ============================================================
-- TRIGGER: crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_productor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.productores_perfil (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Nota: el trigger on_auth_user_created ya existe para ingenieros.
-- Para productores usamos la misma función handle_new_user pero insertamos en productores_perfil también.
-- Si el usuario ya existe como ingeniero, esto simplemente no hace nada (on conflict do nothing).
