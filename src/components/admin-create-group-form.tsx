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

  return (
    <form className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200" onSubmit={submit}>
      <h1 className="text-3xl font-black text-slate-950">Criar grupo de bolão</h1>
      <input className="mt-6 w-full rounded-2xl border p-3" name="name" placeholder="Nome do grupo" required />
      <input className="mt-3 w-full rounded-2xl border p-3" name="slug" placeholder="familia-copa" required />
      <input className="mt-3 w-full rounded-2xl border p-3" name="adminWhatsapp" placeholder="WhatsApp admin" required />
      <input className="mt-3 w-full rounded-2xl border p-3" name="pixAmount" placeholder="Valor, ex.: 20" required type="number" step="0.01" />
      <button className="mt-5 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white">Criar</button>
      {error ? <p className="mt-4 text-red-600">{error}</p> : null}
      {result ? (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          Link privado: <br />
          <code>{`${location.origin}/bolao/${result.slug}?invite=${result.invite_token}`}</code>
        </div>
      ) : null}
    </form>
  );
}
