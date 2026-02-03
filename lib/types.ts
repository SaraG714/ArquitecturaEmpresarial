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
