-- Ejecuta este SQL en Supabase: SQL Editor > New query
-- Crea las tablas para temas y preguntas (monitoría de investigación)

-- Tabla de temas (para organizar preguntas)
create table if not exists temas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz default now()
);

-- Tabla de preguntas (columna "enunciado" = texto de la pregunta)
create table if not exists preguntas (
  id uuid primary key default gen_random_uuid(),
  enunciado text not null,
  tema_id uuid references temas(id) on delete set null,
  created_at timestamptz default now()
);

-- Índices para búsquedas y filtros
create index if not exists idx_preguntas_tema_id on preguntas(tema_id);

-- RLS: permitir leer y escribir a todos (ajusta después si añades auth)
alter table temas enable row level security;
alter table preguntas enable row level security;

-- Quitar políticas si ya existen (para poder re-ejecutar el script sin error)
drop policy if exists "Permitir todo en temas" on temas;
drop policy if exists "Permitir todo en preguntas" on preguntas;

create policy "Permitir todo en temas" on temas for all using (true) with check (true);
create policy "Permitir todo en preguntas" on preguntas for all using (true) with check (true);
