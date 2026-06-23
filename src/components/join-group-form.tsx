"use client";

import { FormEvent, useState } from "react";
import { BetsPanel } from "@/components/bets-panel";

type RegistrationResult = {
  group: { id: string; name: string; pix_amount_cents: number };
  participant: { id: string; name: string; whatsapp: string };
  member: { id: string; status: string } | null;
};

type PaymentResult = {
  payment: {
    id: string;
    status: string;
    pix_qr_code?: string;
    pix_qr_code_base64?: string;
    amount_cents: number;
  };
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const safeReadJson = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
};

export function JoinGroupForm({ inviteToken }: { inviteToken: string }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);
  const [payment, setPayment] = useState<PaymentResult["payment"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/participants/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, whatsapp, inviteToken }),
    });

    const json = await safeReadJson(response);
    setLoading(false);

    if (!response.ok) {
      const error = json.error as { formErrors?: string[] } | string | undefined;
      setError(typeof error === "string" ? error : error?.formErrors?.[0] ?? "Não foi possível entrar no grupo.");
      return;
    }

    setRegistration(json as RegistrationResult);
  };

  const createPayment = async () => {
    if (!registration) return;

    setError(null);
    setLoading(true);
    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: registration.group.id,
        participantId: registration.participant.id,
      }),
    });

    const json = (await safeReadJson(response)) as Partial<PaymentResult> & { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(json.error ?? "Não foi possível gerar o PIX.");
      return;
    }

    if (!json.payment) {
      setError("PIX não foi retornado pelo Mercado Pago.");
      return;
    }

    setPayment(json.payment);
  };

  const refreshPayment = async () => {
    if (!payment) return;

    setError(null);
    setLoading(true);
    const response = await fetch("/api/payments/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: payment.id }),
    });

    const json = (await safeReadJson(response)) as Partial<PaymentResult> & { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(json.error ?? "Não foi possível verificar o pagamento.");
      return;
    }

    if (json.payment?.status === "approved") {
      setPayment(json.payment);
      setError(null);
      return;
    }

    setError("Pagamento ainda não aprovado pelo Mercado Pago. Tente novamente em alguns segundos.");
  };

  if (payment) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">PIX gerado</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Pague para liberar seus palpites</h2>
        <p className="mt-2 text-slate-600">Valor: {formatCurrency(payment.amount_cents)}</p>
        {payment.pix_qr_code_base64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="QR Code PIX"
            className="mt-5 h-56 w-56 rounded-2xl border border-slate-200 bg-white p-3"
            src={`data:image/png;base64,${payment.pix_qr_code_base64}`}
          />
        ) : null}
        {payment.pix_qr_code ? (
          <textarea
            readOnly
            className="mt-5 h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
            value={payment.pix_qr_code}
          />
        ) : null}
        <p className="mt-4 text-sm text-slate-500">
          Quando o Mercado Pago confirmar o pagamento, seu acesso será liberado automaticamente e você receberá aviso no WhatsApp.
        </p>
        {payment.status === "approved" ? (
          <>
            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Pagamento confirmado! Seus palpites já estão liberados.
            </div>
            {registration ? <BetsPanel groupId={registration.group.id} participantId={registration.participant.id} /> : null}
          </>
        ) : (
          <button
            className="mt-5 w-full rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            disabled={loading}
            onClick={refreshPayment}
          >
            {loading ? "Verificando..." : "Já paguei, verificar pagamento"}
          </button>
        )}
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </section>
    );
  }

  if (registration) {
    if (registration.member?.status === "paid") {
      return (
        <section className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Acesso liberado</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Olá, {registration.participant.name}</h2>
          <p className="mt-2 text-slate-600">Pagamento já confirmado. Você pode ver ou alterar seus palpites abaixo.</p>
          <BetsPanel groupId={registration.group.id} participantId={registration.participant.id} />
        </section>
      );
    }

    return (
      <section className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Identificação concluída</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Olá, {registration.participant.name}</h2>
        <p className="mt-2 text-slate-600">
          Grupo: {registration.group.name}. Valor do bolão: {formatCurrency(registration.group.pix_amount_cents)}.
        </p>
        <button
          className="mt-6 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          disabled={loading}
          onClick={createPayment}
        >
          {loading ? "Gerando..." : "Gerar PIX Mercado Pago"}
        </button>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>
    );
  }

  return (
    <form className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100" onSubmit={register}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Entrar no bolão</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">Identifique-se para participar</h2>
      <label className="mt-6 block text-sm font-medium text-slate-700">
        Nome
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: João Silva"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        WhatsApp
        <input
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-emerald-500 transition focus:ring-2"
          required
          value={whatsapp}
          onChange={(event) => setWhatsapp(event.target.value)}
          placeholder="Ex.: 11999999999"
        />
      </label>
      <button
        className="mt-6 w-full rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Entrando..." : "Continuar"}
      </button>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
