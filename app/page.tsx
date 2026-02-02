"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tema, Pregunta, PreguntaConTema } from "@/lib/types";

export default function Home() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaConTema[]>([]);
  const [nuevoTema, setNuevoTema] = useState("");
  const [nuevaPregunta, setNuevaPregunta] = useState("");
  const [temaSeleccionado, setTemaSeleccionado] = useState<string>("");
  const [filtroTema, setFiltroTema] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const [resTemas, resPreguntas] = await Promise.all([
        supabase.from("temas").select("*").order("nombre"),
        supabase
          .from("preguntas")
          .select("id, texto, tema_id, created_at, temas(nombre)")
          .order("created_at", { ascending: false }),
      ]);
      if (resTemas.error) throw resTemas.error;
      if (resPreguntas.error) throw resPreguntas.error;
      setTemas(resTemas.data ?? []);
      setPreguntas((resPreguntas.data ?? []) as PreguntaConTema[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function agregarTema(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nuevoTema.trim();
    if (!nombre) return;
    setEnviando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("temas").insert({ nombre });
      if (err) throw err;
      setNuevoTema("");
      await cargarDatos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear tema");
    } finally {
      setEnviando(false);
    }
  }

  async function agregarPregunta(e: React.FormEvent) {
    e.preventDefault();
    const texto = nuevaPregunta.trim();
    if (!texto) return;
    setEnviando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("preguntas").insert({
        texto,
        tema_id: temaSeleccionado || null,
      });
      if (err) throw err;
      setNuevaPregunta("");
      setTemaSeleccionado("");
      await cargarDatos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar pregunta");
    } finally {
      setEnviando(false);
    }
  }

  const preguntasFiltradas =
    filtroTema === ""
      ? preguntas
      : preguntas.filter((p) => p.tema_id === filtroTema);

  const preguntasPorTema = temas.map((t) => ({
    tema: t,
    items: preguntasFiltradas.filter((p) => p.tema_id === t.id),
  }));
  const sinTema = preguntasFiltradas.filter((p) => !p.tema_id);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-200">
            Banco de preguntas – Monitoría
          </h1>
          <p className="mt-1 text-stone-600 dark:text-stone-400">
            Añade temas y preguntas para organizar el material.
          </p>
        </header>

        {error && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Crear tema */}
        <section className="mb-8 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Nuevo tema
          </h2>
          <form onSubmit={agregarTema} className="flex gap-2">
            <input
              type="text"
              value={nuevoTema}
              onChange={(e) => setNuevoTema(e.target.value)}
              placeholder="Ej: Metodología, Resultados..."
              className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
              disabled={enviando}
            />
            <button
              type="submit"
              disabled={enviando || !nuevoTema.trim()}
              className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              Añadir tema
            </button>
          </form>
        </section>

        {/* Crear pregunta */}
        <section className="mb-8 rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Nueva pregunta
          </h2>
          <form onSubmit={agregarPregunta} className="space-y-3">
            <div>
              <label htmlFor="tema" className="mb-1 block text-sm text-stone-600 dark:text-stone-400">
                Tema (opcional)
              </label>
              <select
                id="tema"
                value={temaSeleccionado}
                onChange={(e) => setTemaSeleccionado(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                disabled={enviando}
              >
                <option value="">Sin tema</option>
                {temas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pregunta" className="mb-1 block text-sm text-stone-600 dark:text-stone-400">
                Pregunta
              </label>
              <textarea
                id="pregunta"
                value={nuevaPregunta}
                onChange={(e) => setNuevaPregunta(e.target.value)}
                placeholder="Escribe la pregunta..."
                rows={3}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
                disabled={enviando}
              />
            </div>
            <button
              type="submit"
              disabled={enviando || !nuevaPregunta.trim()}
              className="w-full rounded-lg bg-amber-600 py-2 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50 sm:w-auto sm:px-6"
            >
              Guardar pregunta
            </button>
          </form>
        </section>

        {/* Listado de preguntas */}
        <section className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 px-4 py-3 dark:border-stone-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Preguntas guardadas
            </h2>
            <select
              value={filtroTema}
              onChange={(e) => setFiltroTema(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
            >
              <option value="">Todos los temas</option>
              {temas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="p-4">
            {cargando ? (
              <p className="text-stone-500 dark:text-stone-400">Cargando…</p>
            ) : preguntasFiltradas.length === 0 ? (
              <p className="text-stone-500 dark:text-stone-400">
                Aún no hay preguntas. Añade la primera arriba.
              </p>
            ) : (
              <ul className="space-y-6">
                {preguntasPorTema.map(
                  ({ tema, items }) =>
                    items.length > 0 && (
                      <li key={tema.id}>
                        <h3 className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                          {tema.nombre}
                        </h3>
                        <ul className="space-y-2">
                          {items.map((p) => (
                            <li
                              key={p.id}
                              className="rounded-lg border border-stone-200 bg-stone-50 py-2 px-3 text-stone-800 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-200"
                            >
                              {p.texto}
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                )}
                {sinTema.length > 0 && (
                  <li>
                    <h3 className="mb-2 text-sm font-semibold text-stone-500 dark:text-stone-400">
                      Sin tema
                    </h3>
                    <ul className="space-y-2">
                      {sinTema.map((p) => (
                        <li
                          key={p.id}
                          className="rounded-lg border border-stone-200 bg-stone-50 py-2 px-3 text-stone-800 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-200"
                        >
                          {p.texto}
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
