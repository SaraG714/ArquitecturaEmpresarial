"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Perfil } from "@/lib/types";

type SidebarProps = {
  user: User | null;
  profile: Perfil | null;
  signOut: () => Promise<void>;
  sidebarAbierto: boolean;
  setSidebarAbierto: (v: boolean) => void;
  paginaActual?: "dashboard" | "examenes";
};

export default function Sidebar({
  user,
  profile,
  signOut,
  sidebarAbierto,
  setSidebarAbierto,
  paginaActual = "dashboard",
}: SidebarProps) {
  const linkClass = (pagina: "dashboard" | "examenes") =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
      paginaActual === pagina
        ? "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-200 ${
        sidebarAbierto ? "w-56" : "w-20"
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        {sidebarAbierto && (
          <span className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Banco Preguntas
          </span>
        )}
        <button
          type="button"
          onClick={() => setSidebarAbierto(!sidebarAbierto)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label={sidebarAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          <svg
            className={`h-5 w-5 transition-transform ${!sidebarAbierto ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        <Link href="/" className={linkClass("dashboard")}>
          <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {sidebarAbierto && <span>Dashboard</span>}
        </Link>
        <Link href="/#temas" className={linkClass("dashboard")}>
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {sidebarAbierto && <span>Temas</span>}
        </Link>
        <Link href="/#preguntas" className={linkClass("dashboard")}>
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {sidebarAbierto && <span>Preguntas</span>}
        </Link>
        <Link href="/examenes" className={linkClass("examenes")}>
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {sidebarAbierto && <span>Exámenes</span>}
        </Link>
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        {sidebarAbierto && profile && user && (
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <p className="truncate font-medium text-slate-800 dark:text-slate-200" title={profile.nombre ?? user.email ?? ""}>
              {profile.nombre || user.email || "Usuario"}
            </p>
            <p className="capitalize">{profile.rol}</p>
            <button
              type="button"
              onClick={() => signOut()}
              className="mt-2 w-full rounded-lg border border-slate-300 py-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        )}
        {sidebarAbierto && !profile && <p className="text-xs text-slate-500 dark:text-slate-400">Monitoría de investigación</p>}
      </div>
    </aside>
  );
}
