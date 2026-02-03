"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AuthForm from "@/components/AuthForm";
import Sidebar from "@/components/Sidebar";
import type { Tema, PreguntaConTema } from "@/lib/types";

export default function Home() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaConTema[]>([]);
  const [nuevoTema, setNuevoTema] = useState("");
  const [nuevaPregunta, setNuevaPregunta] = useState("");
  const [temaSeleccionado, setTemaSeleccionado] = useState<string>("");
  const [filtroTema, setFiltroTema] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  async function cargarDatos() {
    setCargando(true);
    setError(null);
    try {
      const [resTemas, resPreguntas] = await Promise.all([
        supabase.from("temas").select("*").order("nombre"),
        supabase
          .from("preguntas")
          .select("id, enunciado, tema_id, created_at, temas(nombre)")
          .order("created_at", { ascending: false }),
      ]);
      if (resTemas.error) throw resTemas.error;
      if (resPreguntas.error) throw resPreguntas.error;
      setTemas(resTemas.data ?? []);
      const raw = (resPreguntas.data ?? []) as Array<Omit<PreguntaConTema, "temas"> & { temas?: { nombre: string } | { nombre: string }[] | null }>;
      const normalizado: PreguntaConTema[] = raw.map((p) => ({
        id: p.id,
        enunciado: p.enunciado,
        tema_id: p.tema_id,
        created_at: p.created_at,
        temas: Array.isArray(p.temas) ? (p.temas[0] ?? null) : p.temas ?? null,
      }));
      setPreguntas(normalizado);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : e instanceof Error
            ? e.message
            : "Error al cargar datos";
      setError(msg);
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
        enunciado: texto,
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        user={user}
        profile={profile}
        signOut={signOut}
        sidebarAbierto={sidebarAbierto}
        setSidebarAbierto={setSidebarAbierto}
        paginaActual="dashboard"
      />

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-200 ${sidebarAbierto ? "pl-56" : "pl-20"}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona temas y preguntas del banco
          </p>
        </header>

        <div className="p-6">
          {error && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Stats cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total temas
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
                {cargando ? "—" : temas.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total preguntas
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
                {cargando ? "—" : preguntas.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Sin tema
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
                {cargando ? "—" : preguntas.filter((p) => !p.tema_id).length}
              </p>
            </div>
          </div>

          {/* Forms row */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2" id="temas">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8v8H4V4h8z" />
                  </svg>
                </span>
                Nuevo tema
              </h2>
              <form onSubmit={agregarTema} className="flex gap-2">
                <input
                  type="text"
                  value={nuevoTema}
                  onChange={(e) => setNuevoTema(e.target.value)}
                  placeholder="Ej: Metodología, Resultados..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  disabled={enviando}
                />
                <button
                  type="submit"
                  disabled={enviando || !nuevoTema.trim()}
                  className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  Añadir
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" id="preguntas">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Nueva pregunta
              </h2>
              <form onSubmit={agregarPregunta} className="space-y-3">
                <div>
                  <label htmlFor="tema" className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
                    Tema (opcional)
                  </label>
                  <select
                    id="tema"
                    value={temaSeleccionado}
                    onChange={(e) => setTemaSeleccionado(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                  <label htmlFor="pregunta" className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
                    Pregunta
                  </label>
                  <textarea
                    id="pregunta"
                    value={nuevaPregunta}
                    onChange={(e) => setNuevaPregunta(e.target.value)}
                    placeholder="Escribe la pregunta..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    disabled={enviando}
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviando || !nuevaPregunta.trim()}
                  className="w-full rounded-lg bg-amber-600 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50 sm:w-auto sm:px-6"
                >
                  Guardar pregunta
                </button>
              </form>
            </section>
          </div>

          {/* Preguntas table / list */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Preguntas guardadas
              </h2>
              <select
                value={filtroTema}
                onChange={(e) => setFiltroTema(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">Todos los temas</option>
                {temas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-5">
              {cargando ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Cargando…
                </div>
              ) : preguntasFiltradas.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Aún no hay preguntas. Añade la primera arriba.
                </p>
              ) : (
                <ul className="space-y-6">
                  {preguntasPorTema.map(
                    ({ tema, items }) =>
                      items.length > 0 && (
                        <li key={tema.id}>
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {tema.nombre}
                          </h3>
                          <ul className="space-y-2">
                            {items.map((p) => (
                              <li
                                key={p.id}
                                className="rounded-lg border border-slate-200 bg-slate-50/80 py-2.5 px-4 text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                              >
                                {p.enunciado}
                              </li>
                            ))}
                          </ul>
                        </li>
                      )
                  )}
                  {sinTema.length > 0 && (
                    <li>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Sin tema
                      </h3>
                      <ul className="space-y-2">
                        {sinTema.map((p) => (
                          <li
                            key={p.id}
                            className="rounded-lg border border-slate-200 bg-slate-50/80 py-2.5 px-4 text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
                          >
                            {p.enunciado}
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
      </main>
    </div>
  );
}
