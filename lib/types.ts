export type Tema = {
  id: string;
  nombre: string;
  created_at?: string;
};

export type Pregunta = {
  id: string;
  texto: string;
  tema_id: string | null;
  created_at?: string;
};

export type PreguntaConTema = Pregunta & {
  temas: { nombre: string } | null;
};
