"use client";

import { FormEvent, useState } from "react";
import { getPredefinedMatchesByDate } from "@/lib/predefined-matches";

const todayMatches = getPredefinedMatchesByDate("2026-06-24");

export function AdminCreateGroupForm() {
  const [result, setResult] = useState<{ slug: string; invite_token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState(todayMatches[0]?.fixtureId ?? 0);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        adminWhatsapp: form.get("adminWhatsapp"),
        pixAmountCents: Math.round(Number(form.get("pixAmount")) * 100),
        apiFootballFixtureId: selectedFixtureId,
      }),
    });
    const json = await response.json();

    if (!response.ok) {
      setError(json.error?.formErrors?.[0] ?? json.error ?? "Erro ao criar grupo.");
      return;
    }

    setResult(json.group);
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none ring-violet-500 transition focus:border-violet-500 focus:bg-slate-900 focus:ring-2";

  return (
    <form className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-slate-100 shadow-xl shadow-violet-900/10 backdrop-blur-sm" onSubmit={submit}>
      <p className="font-display text-sm uppercase tracking-[0.2em] text-violet-400">Área admin</p>
      <h1 className="mt-2 font-display text-3xl text-slate-100">Criar grupo de bolão</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Defina o nome do grupo, valor fixo do PIX e WhatsApp do administrador. O link privado será gerado automaticamente.
      </p>

      <label className="mt-6 block text-sm font-medium text-slate-400">
        Nome do grupo
        <input className={inputClass} name="name" placeholder="Ex.: Bolão Família Copa" required />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-400">
        Slug do grupo
        <input className={inputClass} name="slug" placeholder="familia-copa" required />
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          O slug é o identificador do bolão. Ele aparece no link e será usado para cadastrar jogos e consultar palpites.
          Exemplo: <strong className="text-violet-300">familia-copa</strong>. Guarde esse nome.
        </span>
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-400">
        WhatsApp admin
        <input className={inputClass} name="adminWhatsapp" placeholder="Ex.: 11999999999" required />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-400">
        Valor do PIX
        <input className={inputClass} name="pixAmount" placeholder="Ex.: 20" required type="number" step="0.01" />
      </label>

      <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
        <p className="font-display text-sm text-violet-300">Jogo do grupo</p>
        <div className="mt-3 space-y-3">
          {todayMatches.map((match) => (
            <label
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm transition-colors duration-200 hover:border-violet-500/50 hover:bg-slate-900/70"
              key={match.fixtureId}
            >
              <span>
                <strong className="block font-display text-base text-slate-100">
                  {match.homeTeam.name} <span className="text-slate-500">×</span> {match.awayTeam.name}
                </strong>
                <span className="text-slate-500">
                  {new Date(match.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </span>
              <input
                className="h-5 w-5 accent-violet-500"
                checked={selectedFixtureId === match.fixtureId}
                name="apiFootballFixtureId"
                onChange={() => setSelectedFixtureId(match.fixtureId)}
                type="radio"
                value={match.fixtureId}
              />
            </label>
          ))}
        </div>
      </div>

      <button className="mt-6 w-full cursor-pointer rounded-full bg-rose-500 px-6 py-3 font-display text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
        Criar grupo com jogo selecionado
      </button>
      {error ? <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p> : null}
      {result ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <strong>Slug do grupo:</strong>
          <code className="mt-2 block rounded-xl border border-emerald-500/20 bg-slate-900/50 p-3 text-emerald-300">
            {result.slug}
          </code>
          <p className="mt-3 text-xs leading-5 text-emerald-400">
            Enviamos esse slug e o link privado para o WhatsApp admin cadastrado.
          </p>
          <div className="my-4 h-px bg-emerald-500/20" />
          <strong>Link privado gerado:</strong>
          <code className="mt-2 block break-all rounded-xl border border-emerald-500/20 bg-slate-900/50 p-3 text-emerald-300">
            {`${location.origin}/bolao/${result.slug}?invite=${result.invite_token}`}
          </code>
        </div>
      ) : null}
    </form>
  );
}
