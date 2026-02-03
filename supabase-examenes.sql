-- Exámenes: publicar preguntas manuales o desde el banco de preguntas
-- Ejecuta en Supabase: SQL Editor > New query

-- Tabla de exámenes
create table if not exists examenes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Preguntas del examen: pueden ser manuales (enunciado) o del banco (pregunta_id)
-- Al menos uno de los dos debe estar definido
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

-- Actualizar updated_at del examen cuando se añade/edita/elimina una pregunta
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
