-- Ejecuta en Supabase: SQL Editor > New query
-- Inserta la pregunta de prueba (sin depender de la tabla temas).
-- La pregunta aparecerá en la app en la sección "Sin tema".

insert into preguntas (enunciado, tema_id)
values ('¿Cuántas horas hay en un día?', null);
