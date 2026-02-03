"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import type { Perfil } from "@/lib/types";

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [modo, setModo] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Perfil["rol"]>("estudiante");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);
    try {
      if (modo === "login") {
        const { error: err } = await signIn(email, password);
        if (err) setError(err.message);
      } else {
        const { error: err } = await signUp(email, password, nombre.trim(), rol);
        if (err) setError(err.message);
        else setMensaje("Cuenta creada. Revisa tu correo para confirmar (si está habilitado).");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-center text-xl font-semibold text-slate-800 dark:text-slate-100">
          Banco de preguntas
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {modo === "login" ? "Inicia sesión" : "Crear cuenta"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {modo === "register" && (
            <>
              <div>
                <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required={modo === "register"}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label htmlFor="rol" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Rol
                </label>
                <select
                  id="rol"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Perfil["rol"])}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="profesor">Profesor</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {mensaje && (
            <p className="text-sm text-green-600 dark:text-green-400">{mensaje}</p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-amber-600 py-2.5 font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {modo === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setModo((m) => (m === "login" ? "register" : "login"));
            setError(null);
            setMensaje(null);
          }}
          className="mt-4 w-full text-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {modo === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </div>
    </div>
  );
}
