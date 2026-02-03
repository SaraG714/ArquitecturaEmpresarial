-- Exámenes + examen de prueba
-- Ejecuta en Supabase: SQL Editor > New query
-- Así tendrás las tablas examenes y examen_preguntas en la database como preguntas, temas y perfiles,
-- y un examen de prueba listo para verse en la app.

-- 1. Tabla examenes (igual que temas: id, nombre/título, created_at)
create table if not exists examenes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tabla examen_preguntas (relaciona examen con preguntas: manual o del banco)
create table if not exists examen_preguntas (
  id uuid primary key default gen_random_uuid(),
  examen_id uuid not null references examenes(id) on delete cascade,
  orden int not null default 0,
  pregunta_id uuid references preguntas(id) on delete set null,
  enunciado_manual text,
  created_at timestamptz default now(),
  constraint chk_origen check (
    (pregunta_id is not null) or (enunciado_manual is not null and trim(enunciado_manual) <> '')
  )
);

create index if not exists idx_examen_preguntas_examen_id on examen_preguntas(examen_id);
create index if not exists idx_examen_preguntas_orden on examen_preguntas(examen_id, orden);

-- RLS
alter table examenes enable row level security;
alter table examen_preguntas enable row level security;

drop policy if exists "Permitir todo en examenes" on examenes;
drop policy if exists "Permitir todo en examen_preguntas" on examen_preguntas;

create policy "Permitir todo en examenes" on examenes for all using (true) with check (true);
create policy "Permitir todo en examen_preguntas" on examen_preguntas for all using (true) with check (true);

-- Trigger para actualizar updated_at del examen
create or replace function actualizar_updated_at_examen()
returns trigger as $$
begin
  update examenes set updated_at = now() where id = coalesce(NEW.examen_id, OLD.examen_id);
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

drop trigger if exists tr_examen_preguntas_updated on examen_preguntas;
create trigger tr_examen_preguntas_updated
after insert or update or delete on examen_preguntas
for each row execute function actualizar_updated_at_examen();

-- 3. Examen de prueba (aparece en Table Editor como los demás)
insert into examenes (titulo, descripcion)
values ('Examen de prueba', 'Examen de ejemplo para ver en Supabase y en la app');

-- 4. Preguntas del examen de prueba (manuales)
insert into examen_preguntas (examen_id, orden, enunciado_manual)
select id, 1, '¿Qué es la metodología de investigación?'
from examenes where titulo = 'Examen de prueba' limit 1;

insert into examen_preguntas (examen_id, orden, enunciado_manual)
select id, 2, '¿Cuáles son las fases de un proyecto?'
from examenes where titulo = 'Examen de prueba' limit 1;

insert into examen_preguntas (examen_id, orden, enunciado_manual)
select id, 3, '¿Qué es el marco teórico?'
from examenes where titulo = 'Examen de prueba' limit 1;
