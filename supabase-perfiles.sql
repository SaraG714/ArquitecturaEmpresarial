-- ============================================================
-- PERFILES: nombre, correo (en Auth), contraseña (en Auth), rol
-- Ejecuta en Supabase: SQL Editor > New query > Run
-- ============================================================
-- El correo y la contraseña se gestionan con Supabase Auth.
-- Esta tabla guarda nombre y rol (profesor | estudiante).
--
-- Antes: en Supabase > Authentication > Providers, activa "Email"
-- si quieres registro con correo y contraseña.

-- 1. Tabla perfiles (vinculada al usuario de Auth)
create table if not exists public.perfiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  nombre text,
  rol text not null default 'estudiante' check (rol in ('profesor', 'estudiante')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Crear perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (user_id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'rol', 'estudiante')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Quitar trigger si ya existe (para poder re-ejecutar el script)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. RLS: cada usuario ve y edita solo su perfil
alter table public.perfiles enable row level security;

drop policy if exists "Usuarios ven su propio perfil" on public.perfiles;
create policy "Usuarios ven su propio perfil"
  on public.perfiles for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios actualizan su propio perfil" on public.perfiles;
create policy "Usuarios actualizan su propio perfil"
  on public.perfiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- El insert lo hace el trigger (security definer), no hace falta policy de insert para usuarios.
-- Para que el trigger inserte, permitimos insert desde el propio trigger (ya es definer).

-- 4. Índice para buscar perfil por user_id
create index if not exists idx_perfiles_user_id on public.perfiles(user_id);
