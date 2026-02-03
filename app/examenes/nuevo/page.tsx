"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AuthForm from "@/components/AuthForm";
import Sidebar from "@/components/Sidebar";

export default function NuevoExamenPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  async function crearExamen(e: React.FormEvent) {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return;
    setEnviando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("examenes")
        .insert({ titulo: t, descripcion: descripcion.trim() || null })
        .select("id")
        .single();
      if (err) throw err;
      router.push(`/examenes/${(data as { id: string }).id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear examen");
    } finally {
      setEnviando(false);
    }
  }

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

  if (profile?.rol === "estudiante") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">Solo los profesores pueden crear exámenes.</p>
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
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Nuevo examen</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Después podrás añadir preguntas manuales o del banco</p>
            </div>
          </div>
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

          <form onSubmit={crearExamen} className="mx-auto max-w-xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Título del examen *
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Parcial 1 - Metodología"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={enviando}
              />
            </div>
            <div>
              <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Descripción (opcional)
              </label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción del examen..."
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={enviando}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={enviando || !titulo.trim()}
                className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {enviando ? "Creando…" : "Crear examen"}
              </button>
              <Link
                href="/examenes"
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
