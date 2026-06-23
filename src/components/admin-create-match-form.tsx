"use client";

import { FormEvent, useState } from "react";

export function AdminCreateMatchForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const localStartsAt = String(form.get("startsAt"));
    const startsAt = new Date(localStartsAt).toISOString();
    const fixtureId = String(form.get("apiFootballFixtureId") ?? "").trim();

    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupSlug: form.get("groupSlug"),
        homeTeam: form.get("homeTeam"),
        awayTeam: form.get("awayTeam"),
        startsAt,
        ...(fixtureId ? { apiFootballFixtureId: Number(fixtureId) } : {}),
      }),
    });

    const json = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(json.error?.formErrors?.[0] ?? json.error ?? "Erro ao cadastrar jogo.");
      return;
    }

    setMessage(`Jogo cadastrado: ${json.match.home_team} x ${json.match.away_team}`);
  };

  return (
    <form className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100" onSubmit={submit}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Jogo manual</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Cadastrar próximo jogo</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Use quando a API não retornar o jogo automaticamente. O fixture ID é opcional, mas necessário depois para monitorar gols ao vivo.
      </p>

      <label className="mt-5 block text-sm font-medium text-slate-700">
        Slug do grupo
        <input className={inputClass} name="groupSlug" placeholder="Ex.: sedes" required />
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Mandante
          <input className={inputClass} defaultValue="Escócia" name="homeTeam" required />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Visitante
          <input className={inputClass} defaultValue="Brasil" name="awayTeam" required />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Data e hora
        <input className={inputClass} name="startsAt" required type="datetime-local" />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        API-Football Fixture ID opcional
        <input className={inputClass} name="apiFootballFixtureId" placeholder="Ex.: 1234567" type="number" />
      </label>

      <button className="mt-6 w-full rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60" disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar jogo"}
      </button>

      {message ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
    </form>
  );
}
