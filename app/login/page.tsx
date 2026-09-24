"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clientConfig } from "@/config/client";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const params = useSearchParams();
  const [contrasena, setContrasena] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!contrasena || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contrasena }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo iniciar sesión.");
      const volver = params.get("volver");
      window.location.href = volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      setEnviando(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-n-bg px-4 font-sans text-n-fg">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(700px 320px at 50% -80px, rgba(76,126,255,0.16), transparent 70%)" }}
      />
      <form
        onSubmit={entrar}
        className="relative w-full max-w-[380px] rounded-2xl border border-n-line bg-n-card/80 p-7 shadow-2xl shadow-black/40"
      >
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[20px] font-semibold">{clientConfig.shortName}</span>
          <span className="text-[15px] text-n-muted">{clientConfig.businessType}</span>
        </div>
        <p className="mt-1.5 text-[13.5px] text-n-muted">Entra a tu panel con la contraseña del negocio.</p>

        <label htmlFor="contrasena" className="mt-6 block text-[13px] text-n-muted">
          Contraseña
        </label>
        <div className="mt-1.5 flex items-center rounded-lg border border-n-line2 bg-n-bg/60 focus-within:border-n-acc/60">
          <input
            id="contrasena"
            type={ver ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-[15px] text-n-fg focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="px-3 text-[12.5px] text-n-faint hover:text-n-fg"
          >
            {ver ? "Ocultar" : "Ver"}
          </button>
        </div>

        {error && <p className="mt-3 text-[13px] text-n-bad">{error}</p>}

        <button
          type="submit"
          disabled={enviando || !contrasena}
          className="mt-5 w-full rounded-lg bg-n-acc py-2.5 text-[14.5px] font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
        <p className="mt-4 text-center text-[12px] text-n-faint">
          La sesión queda abierta 30 días en este dispositivo.
        </p>
      </form>
    </main>
  );
}
