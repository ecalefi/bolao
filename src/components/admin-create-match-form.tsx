"use client";

import { FormEvent, useState } from "react";
import { getPredefinedMatchesByDate, type PredefinedMatch as AvailableMatch } from "@/lib/predefined-matches";

const dateInSaoPaulo = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function AdminCreateMatchForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState("");
  const [matches] = useState<AvailableMatch[]>(() => getPredefinedMatchesByDate(dateInSaoPaulo()));
  const [savingFixtureId, setSavingFixtureId] = useState<number | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const inputClass =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2";

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));

  const selectMatch = async (match: AvailableMatch) => {
    if (!groupSlug.trim()) {
      setMessage("Informe o slug do grupo antes de escolher o jogo.");
      return;
    }

    setMessage(null);
    setSavingFixtureId(match.fixtureId);

    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupSlug,
        apiFootballFixtureId: match.fixtureId,
      }),
    });

    const json = await response.json();
    setSavingFixtureId(null);

    if (!response.ok) {
      setMessage(json.error?.formErrors?.[0] ?? json.error ?? "Erro ao vincular jogo.");
      return;
    }

    setMessage(`Jogo vinculado ao grupo: ${json.match.home_team} x ${json.match.away_team}`);
  };

  const submitManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setSavingFixtureId(-1);

    const form = new FormData(event.currentTarget);
    const localStartsAt = String(form.get("startsAt"));
    const startsAt = new Date(localStartsAt).toISOString();
    const fixtureId = String(form.get("apiFootballFixtureId") ?? "").trim();

    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupSlug,
        homeTeam: form.get("homeTeam"),
        awayTeam: form.get("awayTeam"),
        startsAt,
        ...(fixtureId ? { apiFootballFixtureId: Number(fixtureId) } : {}),
      }),
    });

    const json = await response.json();
    setSavingFixtureId(null);

    if (!response.ok) {
      setMessage(json.error?.formErrors?.[0] ?? json.error ?? "Erro ao cadastrar jogo.");
      return;
    }

    setMessage(`Jogo cadastrado: ${json.match.home_team} x ${json.match.away_team}`);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Jogos pré-cadastrados</p>

      <label className="mt-5 block text-sm font-medium text-slate-700">
        Slug do grupo
        <input
          className={inputClass}
          name="groupSlug"
          onChange={(event) => setGroupSlug(event.target.value)}
          placeholder="Ex.: familia-copa"
          required
          value={groupSlug}
        />
      </label>

      {matches.length > 0 ? (
        <div className="mt-5 max-h-[32rem] space-y-3 overflow-auto pr-1">
          {matches.map((match) => (
            <div key={match.fixtureId} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                    {match.league ? `${match.league.name} • ${match.league.country}` : "Competição não informada"}
                  </p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">
                    {match.homeTeam.name} x {match.awayTeam.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(match.startsAt)} • Status {match.status} • Fixture {match.fixtureId}
                  </p>
                </div>
                <button
                  className="rounded-full bg-yellow-300 px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-yellow-200 disabled:opacity-60"
                  disabled={savingFixtureId === match.fixtureId}
                  onClick={() => selectMatch(match)}
                  type="button"
                >
                  {savingFixtureId === match.fixtureId ? "Vinculando..." : "Usar este jogo"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        className="mt-5 text-sm font-semibold text-emerald-700 underline underline-offset-4"
        onClick={() => setManualOpen((current) => !current)}
        type="button"
      >
        {manualOpen ? "Ocultar cadastro manual" : "Não achei o jogo? Cadastrar manualmente"}
      </button>

      {manualOpen ? (
        <form className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200" onSubmit={submitManual}>
          <p className="text-sm font-bold text-slate-950">Cadastro manual de fallback</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Mandante
              <input className={inputClass} name="homeTeam" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Visitante
              <input className={inputClass} name="awayTeam" required />
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

          <button
            className="mt-5 w-full rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={savingFixtureId === -1}
          >
            {savingFixtureId === -1 ? "Cadastrando..." : "Cadastrar jogo manual"}
          </button>
        </form>
      ) : null}

      {message ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
    </div>
  );
}
