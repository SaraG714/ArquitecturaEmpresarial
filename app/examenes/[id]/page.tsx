"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AuthForm from "@/components/AuthForm";
import Sidebar from "@/components/Sidebar";
import type { Examen, ExamenPreguntaConTexto, PreguntaConTema, Tema } from "@/lib/types";

type ModoAgregar = "manual" | "banco";

export default function EditarExamenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [examen, setExamen] = useState<Examen | null>(null);
  const [preguntasExamen, setPreguntasExamen] = useState<ExamenPreguntaConTexto[]>([]);
  const [preguntasBanco, setPreguntasBanco] = useState<PreguntaConTema[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  const [modoAgregar, setModoAgregar] = useState<ModoAgregar>("manual");
  const [enunciadoManual, setEnunciadoManual] = useState("");
  const [preguntaBancoSeleccionada, setPreguntaBancoSeleccionada] = useState("");
  const [filtroTemaBanco, setFiltroTemaBanco] = useState("");

  async function cargarExamen() {
    const { data, error: err } = await supabase.from("examenes").select("*").eq("id", id).single();
    if (err) throw err;
    setExamen((data as Examen) ?? null);
  }

  async function cargarPreguntasExamen() {
    const { data: ep, error: errEp } = await supabase
      .from("examen_preguntas")
      .select("id, examen_id, orden, pregunta_id, enunciado_manual, created_at")
      .eq("examen_id", id)
      .order("orden", { ascending: true });

    if (errEp) throw errEp;
    const filas = (ep ?? []) as Array<{
      id: string;
      examen_id: string;
      orden: number;
      pregunta_id: string | null;
      enunciado_manual: string | null;
      created_at?: string;
    }>;

    const idsPreguntas = filas.filter((f) => f.pregunta_id).map((f) => f.pregunta_id as string);
    let enunciadosMap: Record<string, string> = {};
    if (idsPreguntas.length > 0) {
      const { data: preguntasData } = await supabase.from("preguntas").select("id, enunciado").in("id", idsPreguntas);
      const list = (preguntasData ?? []) as Array<{ id: string; enunciado: string }>;
      list.forEach((p) => {
        enunciadosMap[p.id] = p.enunciado;
      });
    }

    const conTexto: ExamenPreguntaConTexto[] = filas.map((f, idx) => ({
      ...f,
      orden: f.orden ?? idx,
      enunciado: f.pregunta_id ? enunciadosMap[f.pregunta_id] ?? "(sin enunciado)" : (f.enunciado_manual ?? ""),
    }));
    setPreguntasExamen(conTexto);
  }

  async function cargarBancoYTemas() {
    const [resTemas, resPreguntas] = await Promise.all([
      supabase.from("temas").select("*").order("nombre"),
      supabase
        .from("preguntas")
        .select("id, enunciado, tema_id, created_at, temas(nombre)")
        .order("created_at", { ascending: false }),
    ]);
    if (resTemas.error) throw resTemas.error;
    if (resPreguntas.error) throw resPreguntas.error;
    setTemas((resTemas.data ?? []) as Tema[]);
    const raw = (resPreguntas.data ?? []) as Array<Omit<PreguntaConTema, "temas"> & { temas?: { nombre: string } | { nombre: string }[] | null }>;
    const normalizado: PreguntaConTema[] = raw.map((p) => ({
      id: p.id,
      enunciado: p.enunciado,
      tema_id: p.tema_id,
      created_at: p.created_at,
      temas: Array.isArray(p.temas) ? (p.temas[0] ?? null) : p.temas ?? null,
    }));
    setPreguntasBanco(normalizado);
  }

  async function cargarTodo() {
    setCargando(true);
    setError(null);
    try {
      await Promise.all([cargarExamen(), cargarPreguntasExamen(), cargarBancoYTemas()]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar";
      setError(msg);
      setExamen(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (id) cargarTodo();
  }, [id]);

  async function agregarPreguntaManual(e: React.FormEvent) {
    e.preventDefault();
    const texto = enunciadoManual.trim();
    if (!texto) return;
    setEnviando(true);
    setError(null);
    try {
      const maxOrden = preguntasExamen.length === 0 ? 0 : Math.max(...preguntasExamen.map((p) => p.orden), 0);
      const { error: err } = await supabase.from("examen_preguntas").insert({
        examen_id: id,
        orden: maxOrden + 1,
        enunciado_manual: texto,
        pregunta_id: null,
      });
      if (err) throw err;
      setEnunciadoManual("");
      await cargarPreguntasExamen();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar pregunta");
    } finally {
      setEnviando(false);
    }
  }

  async function agregarPreguntaDelBanco(e: React.FormEvent) {
    e.preventDefault();
    const preguntaId = preguntaBancoSeleccionada.trim();
    if (!preguntaId) return;
    setEnviando(true);
    setError(null);
    try {
      const maxOrden = preguntasExamen.length === 0 ? 0 : Math.max(...preguntasExamen.map((p) => p.orden), 0);
      const { error: err } = await supabase.from("examen_preguntas").insert({
        examen_id: id,
        orden: maxOrden + 1,
        pregunta_id: preguntaId,
        enunciado_manual: null,
      });
      if (err) throw err;
      setPreguntaBancoSeleccionada("");
      await cargarPreguntasExamen();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar pregunta del banco");
    } finally {
      setEnviando(false);
    }
  }

  async function quitarPregunta(examenPreguntaId: string) {
    setEnviando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("examen_preguntas").delete().eq("id", examenPreguntaId);
      if (err) throw err;
      await cargarPreguntasExamen();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al quitar pregunta");
    } finally {
      setEnviando(false);
    }
  }

  const preguntasBancoFiltradas =
    filtroTemaBanco === ""
      ? preguntasBanco
      : preguntasBanco.filter((p) => p.tema_id === filtroTemaBanco);

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

  if (cargando && !examen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  if (!examen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">Examen no encontrado.</p>
          <Link href="/examenes" className="mt-4 inline-block text-amber-600 hover:underline dark:text-amber-400">
            Volver a exámenes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        user={user}
        profile={profile}
        signOut={signOut}
        sidebarAbierto={sidebarAbierto}
        setSidebarAbierto={setSidebarAbierto}
        paginaActual="examenes"
      />
      <main className={`flex-1 transition-all duration-200 ${sidebarAbierto ? "pl-56" : "pl-20"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/examenes"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label="Volver"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{examen.titulo}</h1>
                {examen.descripcion && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{examen.descripcion}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {preguntasExamen.length} pregunta{preguntasExamen.length !== 1 ? "s" : ""}
            </p>
          </div>
        </header>

        <div className="p-6">
          {error && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
              role="alert"
            >
              <p>{error}</p>
              {(error.toLowerCase().includes("does not exist") || error.toLowerCase().includes("no existe")) && (
                <p className="mt-2 text-xs">
                  Ejecuta <code className="rounded bg-red-100 px-1 dark:bg-red-900">supabase-examenes.sql</code> en Supabase.
                </p>
              )}
            </div>
          )}

          {/* Agregar pregunta: solo profesores */}
          {profile?.rol === "profesor" && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Agregar pregunta
            </h2>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setModoAgregar("manual")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  modoAgregar === "manual"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                Escribir manual
              </button>
              <button
                type="button"
                onClick={() => setModoAgregar("banco")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  modoAgregar === "banco"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                Del banco de preguntas
              </button>
            </div>

            {modoAgregar === "manual" && (
              <form onSubmit={agregarPreguntaManual} className="space-y-3">
                <textarea
                  value={enunciadoManual}
                  onChange={(e) => setEnunciadoManual(e.target.value)}
                  placeholder="Escribe la pregunta aquí..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  disabled={enviando}
                />
                <button
                  type="submit"
                  disabled={enviando || !enunciadoManual.trim()}
                  className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  Agregar pregunta manual
                </button>
              </form>
            )}

            {modoAgregar === "banco" && (
              <form onSubmit={agregarPreguntaDelBanco} className="space-y-3">
                <div>
                  <label htmlFor="filtro-tema-banco" className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
                    Filtrar por tema (opcional)
                  </label>
                  <select
                    id="filtro-tema-banco"
                    value={filtroTemaBanco}
                    onChange={(e) => setFiltroTemaBanco(e.target.value)}
                    className="mb-3 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Todos los temas</option>
                    {temas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pregunta-banco" className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
                    Seleccionar pregunta del banco
                  </label>
                  <select
                    id="pregunta-banco"
                    value={preguntaBancoSeleccionada}
                    onChange={(e) => setPreguntaBancoSeleccionada(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    disabled={enviando}
                  >
                    <option value="">— Elegir pregunta —</option>
                    {preguntasBancoFiltradas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.temas?.nombre ? `[${p.temas.nombre}] ` : ""}
                        {p.enunciado.length > 80 ? p.enunciado.slice(0, 80) + "…" : p.enunciado}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={enviando || !preguntaBancoSeleccionada}
                  className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  Agregar pregunta del banco
                </button>
              </form>
            )}
          </section>
          )}

          {/* Lista de preguntas del examen */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Preguntas publicadas en este examen
              </h2>
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
              ) : preguntasExamen.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {profile?.rol === "profesor"
                    ? "Aún no hay preguntas. Agrega manualmente o desde el banco arriba."
                    : "Este examen aún no tiene preguntas."}
                </p>
              ) : (
                <ol className="space-y-3">
                  {preguntasExamen.map((p, idx) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 py-3 px-4 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                        {idx + 1}
                      </span>
                      <p className="flex-1 text-slate-800 dark:text-slate-200">{p.enunciado}</p>
                      {profile?.rol === "profesor" && (
                        <button
                          type="button"
                          onClick={() => quitarPregunta(p.id)}
                          disabled={enviando}
                          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 disabled:opacity-50"
                          aria-label="Quitar pregunta"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
