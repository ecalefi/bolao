"use client";

import { FormEvent, useState } from "react";

export function AdminCreateGroupForm() {
  const [result, setResult] = useState<{ slug: string; invite_token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2";

  return (
    <form className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100" onSubmit={submit}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Área admin</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Criar grupo de bolão</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Defina o nome do grupo, valor fixo do PIX e WhatsApp do administrador. O link privado será gerado automaticamente.
      </p>

      <label className="mt-6 block text-sm font-medium text-slate-700">
        Nome do grupo
        <input className={inputClass} name="name" placeholder="Ex.: Bolão Família Copa" required />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Identificador do link
        <input className={inputClass} name="slug" placeholder="familia-copa" required />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        WhatsApp admin
        <input className={inputClass} name="adminWhatsapp" placeholder="Ex.: 11999999999" required />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Valor do PIX
        <input className={inputClass} name="pixAmount" placeholder="Ex.: 20" required type="number" step="0.01" />
      </label>

      <button className="mt-6 w-full rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700">
        Criar grupo
      </button>
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {result ? (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950 ring-1 ring-emerald-100">
          <strong>Link privado gerado:</strong>
          <code className="mt-2 block break-all rounded-xl bg-white p-3 text-emerald-900 ring-1 ring-emerald-100">
            {`${location.origin}/bolao/${result.slug}?invite=${result.invite_token}`}
          </code>
        </div>
      ) : null}
    </form>
  );
}
