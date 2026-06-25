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
    "mt-2 w-full rounded-xl border border-line bg-surface-alt px-4 py-3 text-fg placeholder:text-muted outline-none ring-accent transition focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <form className="rounded-xl border border-line bg-surface p-6" onSubmit={submit}>
      <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-accent">Área admin</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-fg">Criar grupo de bolão</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Defina o nome do grupo, valor fixo do PIX e WhatsApp do administrador. O link privado será gerado automaticamente.
      </p>

      <label className="mt-6 block text-sm font-medium text-muted">
        Nome do grupo
        <input className={inputClass} name="name" placeholder="Ex.: Bolão Família Copa" required />
      </label>

      <label className="mt-4 block text-sm font-medium text-muted">
        Slug do grupo
        <input className={inputClass} name="slug" placeholder="familia-copa" required />
        <span className="mt-2 block text-xs leading-5 text-muted">
          O slug é o identificador do bolão. Ele aparece no link e será usado para cadastrar jogos e consultar palpites.
          Exemplo: <strong className="text-accent">familia-copa</strong>. Guarde esse nome.
        </span>
      </label>

      <label className="mt-4 block text-sm font-medium text-muted">
        WhatsApp admin
        <input className={inputClass} name="adminWhatsapp" placeholder="Ex.: 11999999999" required />
      </label>

      <label className="mt-4 block text-sm font-medium text-muted">
        Valor do PIX
        <input className={inputClass} name="pixAmount" placeholder="Ex.: 20" required type="number" step="0.01" />
      </label>

      <div className="mt-5 rounded-xl border border-accent/15 bg-accent/5 p-4">
        <p className="font-display text-sm font-bold text-accent">Jogo do grupo</p>
        <div className="mt-3 space-y-3">
          {todayMatches.map((match) => (
            <label
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm transition-all duration-200 hover:border-accent/30 hover:shadow-sm"
              key={match.fixtureId}
            >
              <span>
                <strong className="block font-display text-base font-bold text-fg">
                  {match.homeTeam.name} <span className="text-muted">×</span> {match.awayTeam.name}
                </strong>
                <span className="text-muted">
                  {new Date(match.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </span>
              <input
                className="h-5 w-5 accent-accent"
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

      <button className="mt-6 w-full cursor-pointer rounded-full bg-accent px-6 py-3 font-display text-base font-bold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">
        Criar grupo com jogo selecionado
      </button>
      {error ? (
        <p className="mt-4 rounded-xl border border-danger/20 bg-danger/8 p-3 text-sm text-danger">{error}</p>
      ) : null}
      {result ? (
        <div className="mt-5 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">
          <strong>Slug do grupo:</strong>
          <code className="mt-2 block rounded-xl border border-success/20 bg-surface p-3 text-success">
            {result.slug}
          </code>
          <p className="mt-3 text-xs leading-5 text-success">
            Enviamos esse slug e o link privado para o WhatsApp admin cadastrado.
          </p>
          <div className="my-4 h-px bg-success/20" />
          <strong>Link privado gerado:</strong>
          <code className="mt-2 block break-all rounded-xl border border-success/20 bg-surface p-3 text-success">
            {`${location.origin}/bolao/${result.slug}?invite=${result.invite_token}`}
          </code>
        </div>
      ) : null}
    </form>
  );
}
