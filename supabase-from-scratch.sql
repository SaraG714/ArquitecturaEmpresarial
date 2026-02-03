-- ============================================================
-- BASE DE DATOS DESDE CERO – Banco de preguntas (monitoría)
-- Ejecuta TODO este archivo en Supabase: SQL Editor > New query > Run
-- ============================================================

-- 1. Borrar tablas existentes (preguntas primero por la foreign key)
drop table if exists preguntas;
drop table if exists temas;

-- 2. Tabla temas
create table temas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz default now()
);

-- 3. Tabla preguntas (columna "enunciado" = texto de la pregunta)
create table preguntas (
  id uuid primary key default gen_random_uuid(),
  enunciado text not null,
  tema_id uuid references temas(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Índice para filtrar por tema
create index idx_preguntas_tema_id on preguntas(tema_id);

-- 5. Row Level Security (permite leer/escribir sin auth por ahora)
alter table temas enable row level security;
alter table preguntas enable row level security;

drop policy if exists "Permitir todo en temas" on temas;
drop policy if exists "Permitir todo en preguntas" on preguntas;

create policy "Permitir todo en temas" on temas for all using (true) with check (true);
create policy "Permitir todo en preguntas" on preguntas for all using (true) with check (true);

-- 6. Datos de ejemplo: tema "General" y pregunta de prueba (RETURNING para ver que se insertó)
insert into temas (nombre) values ('General') returning id, nombre;
insert into preguntas (enunciado, tema_id)
values ('¿Cuántas horas hay en un día?', (select id from temas where nombre = 'General' limit 1))
returning id, enunciado, tema_id;
