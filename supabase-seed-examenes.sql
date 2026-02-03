-- Datos de ejemplo para exámenes
-- Ejecuta en Supabase después de supabase-examenes.sql

-- Inserta exámenes de ejemplo
insert into examenes (titulo, descripcion)
values
  ('Examen de metodología', 'Preguntas sobre metodología de investigación'),
  ('Examen parcial 1', 'Primer parcial del curso');

-- Preguntas manuales para el primer examen (si existe)
insert into examen_preguntas (examen_id, orden, enunciado_manual)
select id, 1, '¿Qué es la metodología de investigación?'
from examenes where titulo = 'Examen de metodología' limit 1;

insert into examen_preguntas (examen_id, orden, enunciado_manual)
select id, 2, '¿Cuáles son las fases de un proyecto de investigación?'
from examenes where titulo = 'Examen de metodología' limit 1;

insert into examen_preguntas (examen_id, orden, enunciado_manual)
select id, 1, '¿Qué entiendes por marco teórico?'
from examenes where titulo = 'Examen parcial 1' limit 1;
