-- Movimientos financieros
create table movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text check (tipo in ('gasto', 'ingreso')),
  monto decimal not null,
  moneda text default 'USD',   -- USD | COP | VES
  cuenta text,                  -- Binance | Zelle | PayPal | Bolívares | Bancolombia
  categoria text,
  descripcion text,
  usuario_id int,
  fecha timestamp default now()
);

-- Deudas
create table deudas (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto decimal not null,
  moneda text default 'USD',
  direccion text check (direccion in ('nos_deben', 'debemos')),
  persona text,
  pagada boolean default false,
  usuario_id int,
  fecha timestamp default now()
);

-- Notas
create table notas (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  contenido text,
  tipo text default 'nota',
  usuario_id int,
  fecha timestamp default now()
);

-- Row Level Security (opcional — habilitar cuando quieras)
-- alter table movimientos enable row level security;
-- alter table deudas enable row level security;
-- alter table notas enable row level security;
