"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import AuthForm from "@/components/AuthForm";
import Sidebar from "@/components/Sidebar";
import type { Examen } from "@/lib/types";

export default function ExamenesPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  async function cargarExamenes() {
    setCargando(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("examenes")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setExamenes((data ?? []) as Examen[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar exámenes";
      setError(msg);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarExamenes();
  }, []);

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
        paginaActual="examenes"
      />
      <main className={`flex-1 transition-all duration-200 ${sidebarAbierto ? "pl-56" : "pl-20"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Exámenes</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Crea exámenes y añade preguntas manualmente o desde el banco
              </p>
            </div>
            {profile?.rol === "profesor" && (
              <Link
                href="/examenes/nuevo"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition hover:bg-amber-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8v8H4V4h8z" />
                </svg>
                Nuevo examen
              </Link>
            )}
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
                  Ejecuta <code className="rounded bg-red-100 px-1 dark:bg-red-900">supabase-examenes.sql</code> en el SQL Editor de Supabase.
                </p>
              )}
            </div>
          )}

          {cargando ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando exámenes…
            </div>
          ) : examenes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-4 text-slate-500 dark:text-slate-400">Aún no hay exámenes.</p>
              {profile?.rol === "profesor" && (
                <Link
                  href="/examenes/nuevo"
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700"
                >
                  Crear primer examen
                </Link>
              )}
              {profile?.rol === "estudiante" && (
                <p className="text-sm text-slate-500 dark:text-slate-400">Solo los profesores pueden crear exámenes.</p>
              )}
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {examenes.map((examen) => (
                <li key={examen.id}>
                  <Link
                    href={`/examenes/${examen.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700"
                  >
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100">{examen.titulo}</h2>
                    {examen.descripcion && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                        {examen.descripcion}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {profile?.rol === "profesor" ? "Editar preguntas" : "Ver examen"} →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
