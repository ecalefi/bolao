"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { BetsPanel } from "@/components/bets-panel";

type RegistrationResult = {
  group: { id: string; name: string; pix_amount_cents: number };
  participant: { id: string; name: string; whatsapp: string };
  member: { id: string; status: string } | null;
  session?: { token: string; expiresAt: string };
};

type OtpRequestResult = {
  group: { id: string; name: string; pix_amount_cents: number };
  participant: { id: string; name: string; whatsapp: string };
  otpSent: boolean;
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

const formatWhatsappInput = (value: string) => {
  const digits = value.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const safeReadJson = async (response: Response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
};

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-center gap-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs transition-all duration-200 ${
              s <= step
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                : "bg-slate-800 text-slate-500 ring-1 ring-slate-700"
            }`}
          >
            {s < step ? "✓" : s}
          </div>
          {s < 3 ? (
            <div className={`h-1 flex-1 rounded-full transition-all duration-200 ${s < step ? "bg-violet-600" : "bg-slate-800"}`} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function JoinGroupForm({ inviteToken }: { inviteToken: string }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);
  const [otpRequest, setOtpRequest] = useState<OtpRequestResult | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentResult["payment"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cardClass = "rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-slate-100 shadow-2xl shadow-violet-900/20 backdrop-blur-sm";
  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-4 text-slate-100 outline-none ring-violet-500 transition focus:border-violet-500 focus:bg-slate-900 focus:ring-2";
  const primaryButtonClass =
    "mt-6 w-full cursor-pointer rounded-full bg-rose-500 px-6 py-4 font-display text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:bg-rose-600 hover:shadow-rose-500/40 disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryButtonClass =
    "mt-3 w-full cursor-pointer rounded-full border border-slate-600 bg-slate-800/50 px-6 py-4 font-bold text-slate-300 transition-colors duration-200 hover:bg-slate-800 disabled:opacity-60";

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/request-otp", {
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

    setOtpRequest(json as OtpRequestResult);
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!otpRequest) return;

    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: otpRequest.group.id,
        participantId: otpRequest.participant.id,
        code: otpCode,
      }),
    });

    const json = await safeReadJson(response);
    setLoading(false);

    if (!response.ok) {
      const error = json.error as { formErrors?: string[] } | string | undefined;
      setError(typeof error === "string" ? error : error?.formErrors?.[0] ?? "Código inválido.");
      return;
    }

    const verified = json as RegistrationResult;
    setRegistration(verified);
    setSessionToken(verified.session?.token ?? null);
  };

  const createPayment = async () => {
    if (!registration) return;

    setError(null);
    setLoading(true);
    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { "x-participant-session": sessionToken } : {}),
      },
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

  const refreshPayment = useCallback(async () => {
    if (!payment) return;

    setError(null);
    setLoading(true);
    const response = await fetch("/api/payments/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { "x-participant-session": sessionToken } : {}),
      },
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
  }, [payment, sessionToken]);

  useEffect(() => {
    if (!payment || payment.status === "approved" || !sessionToken) return;

    const interval = window.setInterval(() => {
      void refreshPayment();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [payment, refreshPayment, sessionToken]);

  if (payment) {
    return (
      <section className={cardClass}>
        <ProgressBar step={2} />
        <h2 className="font-display text-3xl">Pague o PIX para entrar no jogo</h2>
        <p className="mt-2 text-slate-400">Valor do bolão: <strong className="text-rose-400">{formatCurrency(payment.amount_cents)}</strong></p>
        {payment.pix_qr_code_base64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="QR Code PIX"
            className="mx-auto mt-5 h-56 w-56 rounded-xl border border-slate-700 bg-white p-3 shadow-lg"
            src={`data:image/png;base64,${payment.pix_qr_code_base64}`}
          />
        ) : null}
        {payment.pix_qr_code ? (
          <textarea
            readOnly
            className="mt-5 h-28 w-full rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-400"
            value={payment.pix_qr_code}
          />
        ) : null}
        <p className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm leading-6 text-violet-300">
          Estamos verificando automaticamente o Mercado Pago a cada 5 segundos. Quando confirmar, seus palpites serão liberados.
        </p>
        {payment.status === "approved" ? (
          <>
            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-400">
              Pagamento confirmado! Seus palpites já estão liberados.
            </div>
            {registration && sessionToken ? (
              <BetsPanel groupId={registration.group.id} participantId={registration.participant.id} sessionToken={sessionToken} />
            ) : null}
          </>
        ) : (
          <button
            className={primaryButtonClass}
            disabled={loading}
            onClick={refreshPayment}
          >
            {loading ? "Verificando..." : "Já paguei, verificar pagamento"}
          </button>
        )}
        {error ? <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p> : null}
      </section>
    );
  }

  if (registration) {
    if (registration.member?.status === "paid" && sessionToken) {
      return (
        <section className={cardClass}>
          <ProgressBar step={3} />
          <h2 className="font-display text-3xl">Olá, {registration.participant.name}</h2>
          <p className="mt-2 text-slate-400">Pagamento já confirmado. Você pode ver ou alterar seus palpites abaixo.</p>
          <BetsPanel groupId={registration.group.id} participantId={registration.participant.id} sessionToken={sessionToken} />
        </section>
      );
    }

    return (
      <section className={cardClass}>
        <ProgressBar step={2} />
        <h2 className="font-display text-3xl">Olá, {registration.participant.name}</h2>
        <p className="mt-2 text-slate-400">
          Grupo: {registration.group.name}. Valor do bolão: {formatCurrency(registration.group.pix_amount_cents)}.
        </p>
        <button
          className={primaryButtonClass}
          disabled={loading}
          onClick={createPayment}
        >
          {loading ? "Gerando..." : "Gerar PIX Mercado Pago"}
        </button>
        {error ? <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p> : null}
      </section>
    );
  }

  if (otpRequest) {
    return (
      <form className={cardClass} onSubmit={verifyOtp}>
        <ProgressBar step={1} />
        <h2 className="font-display text-3xl">Confirme seu WhatsApp</h2>
        <p className="mt-2 text-slate-400">
          Enviamos um código de 6 dígitos para o WhatsApp {otpRequest.participant.whatsapp}.
        </p>
        <label className="mt-6 block text-sm font-medium text-slate-400">
          Código
          <input
            className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-4 text-center font-display text-2xl tracking-[0.35em] text-slate-100 outline-none ring-violet-500 transition focus:bg-slate-900 focus:ring-2"
            inputMode="numeric"
            maxLength={6}
            required
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
          />
        </label>
        <button className={primaryButtonClass} disabled={loading}>
          {loading ? "Verificando..." : "Confirmar código"}
        </button>
        <button
          className={secondaryButtonClass}
          disabled={loading}
          type="button"
          onClick={() => {
            setOtpRequest(null);
            setOtpCode("");
          }}
        >
          Trocar WhatsApp
        </button>
        {error ? <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p> : null}
      </form>
    );
  }

  return (
    <form className={cardClass} onSubmit={requestOtp}>
      <ProgressBar step={1} />
      <h2 className="font-display text-3xl">Entre no bolão</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">Só precisamos do seu nome e WhatsApp para liberar seu acesso com segurança.</p>
      <label className="mt-6 block text-sm font-medium text-slate-400">
        Nome
        <input
          className={inputClass}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: João Silva"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-400">
        WhatsApp
        <input
          className={inputClass}
          required
          value={whatsapp}
          onChange={(event) => setWhatsapp(formatWhatsappInput(event.target.value))}
          placeholder="Ex.: (61) 99193-7376"
        />
      </label>
      <button className={primaryButtonClass} disabled={loading}>
        {loading ? "Enviando código..." : "Enviar código por WhatsApp"}
      </button>
      {error ? <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p> : null}
    </form>
  );
}