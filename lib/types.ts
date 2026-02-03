export type Tema = {
  id: string;
  nombre: string;
  created_at?: string;
};

export type Pregunta = {
  id: string;
  enunciado: string;
  tema_id: string | null;
  created_at?: string;
};

export type PreguntaConTema = Pregunta & {
  temas: { nombre: string } | null;
};

export type Rol = "profesor" | "estudiante";

export type Perfil = {
  id: string;
  user_id: string;
  nombre: string | null;
  rol: Rol;
  created_at?: string;
  updated_at?: string;
};

export type Examen = {
  id: string;
  titulo: string;
  descripcion: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ExamenPregunta = {
  id: string;
  examen_id: string;
  orden: number;
  pregunta_id: string | null;
  enunciado_manual: string | null;
  created_at?: string;
};

export type ExamenPreguntaConTexto = ExamenPregunta & {
  enunciado: string; // desde banco (preguntas.enunciado) o enunciado_manual
};
