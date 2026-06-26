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
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold transition-all duration-200 ${
              s <= step
                ? "bg-accent text-white shadow-sm"
                : "border border-line bg-surface text-muted"
            }`}
          >
            {s < step ? "✓" : s}
          </div>
          {s < 3 ? (
            <div className={`h-1 flex-1 rounded-full transition-all duration-200 ${s < step ? "bg-accent" : "bg-line"}`} />
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
  const [pixCopied, setPixCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const cardClass = "sport-card rounded-[1.75rem] p-5 sm:p-6";
  const inputClass =
    "mt-2 w-full rounded-2xl border border-line bg-surface-alt px-4 py-4 text-fg placeholder:text-muted outline-none ring-accent transition focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20";
  const primaryButtonClass =
    "mt-6 w-full min-h-12 cursor-pointer rounded-full bg-accent px-6 py-4 font-display text-base font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50";
  const secondaryButtonClass =
    "mt-3 w-full min-h-12 cursor-pointer rounded-full border border-line bg-surface px-6 py-4 font-bold text-muted transition-colors duration-200 hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

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
    setPixCopied(false);
  };

  const copyPixCode = async () => {
    if (!payment?.pix_qr_code) return;

    setError(null);

    try {
      await navigator.clipboard.writeText(payment.pix_qr_code);
      setPixCopied(true);

      window.setTimeout(() => setPixCopied(false), 2500);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o código PIX e copie manualmente.");
    }
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

  // Payment step
  if (payment) {
    return (
      <section className={cardClass}>
        <ProgressBar step={2} />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Entrada do bolão</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">Pague o PIX para entrar no jogo</h2>
        <p className="mt-2 text-muted">
          Valor do bolão: <strong className="text-accent">{formatCurrency(payment.amount_cents)}</strong>
        </p>
        {payment.pix_qr_code_base64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="QR Code PIX"
            className="mx-auto mt-5 h-56 w-56 rounded-2xl border border-line bg-white p-3 shadow-sm"
            src={`data:image/png;base64,${payment.pix_qr_code_base64}`}
          />
        ) : null}
        {payment.pix_qr_code ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-fg">PIX copia e cola</p>
              <button
                className="shrink-0 rounded-full border border-accent/25 bg-accent/8 px-4 py-2 text-xs font-bold text-accent transition hover:border-accent hover:bg-accent/15 focus:outline-none focus:ring-2 focus:ring-accent/30"
                type="button"
                onClick={copyPixCode}
              >
                {pixCopied ? "Copiado!" : "Copiar código"}
              </button>
            </div>
            <textarea
              readOnly
              className="h-28 w-full rounded-2xl border border-line bg-surface-alt p-4 text-sm text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              value={payment.pix_qr_code}
              onFocus={(event) => event.currentTarget.select()}
            />
            <p className="text-xs text-muted">Use o botão para copiar ou toque no campo para selecionar o código completo.</p>
          </div>
        ) : null}
        <p className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 p-4 text-sm leading-6 text-accent">
          Estamos verificando automaticamente o Mercado Pago a cada 5 segundos. Quando confirmar, seus palpites serão liberados.
        </p>
        {payment.status === "approved" ? (
          <>
            <div className="mt-5 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm font-bold text-success">
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
        {error ? (
          <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/8 p-3 text-sm text-danger">{error}</p>
        ) : null}
      </section>
    );
  }

  // Registered but not paid
  if (registration) {
    if (registration.member?.status === "paid" && sessionToken) {
      return (
        <section className={cardClass}>
          <ProgressBar step={3} />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Acesso liberado</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Olá, {registration.participant.name}</h2>
          <p className="mt-2 text-muted">Pagamento já confirmado. Você pode ver ou alterar seus palpites abaixo.</p>
          <BetsPanel groupId={registration.group.id} participantId={registration.participant.id} sessionToken={sessionToken} />
        </section>
      );
    }

    return (
      <section className={cardClass}>
        <ProgressBar step={2} />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Quase em campo</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">Olá, {registration.participant.name}</h2>
        <p className="mt-2 text-muted">
          Grupo: {registration.group.name}. Valor do bolão: {formatCurrency(registration.group.pix_amount_cents)}.
        </p>
        <button
          className={primaryButtonClass}
          disabled={loading}
          onClick={createPayment}
        >
          {loading ? "Gerando..." : "Gerar PIX Mercado Pago"}
        </button>
        {error ? (
          <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/8 p-3 text-sm text-danger">{error}</p>
        ) : null}
      </section>
    );
  }

  // OTP verification step
  if (otpRequest) {
    return (
      <form className={cardClass} onSubmit={verifyOtp}>
        <ProgressBar step={1} />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Validação segura</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">Confirme seu WhatsApp</h2>
        <p className="mt-2 text-muted">
          Enviamos um código de 6 dígitos para o WhatsApp {otpRequest.participant.whatsapp}.
        </p>
        <label className="mt-6 block text-sm font-medium text-muted">
          Código
          <input
            className="mt-2 w-full rounded-2xl border border-line bg-surface-alt px-4 py-4 text-center font-display text-2xl font-bold tracking-[0.35em] text-fg outline-none ring-accent transition focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
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
        {error ? (
          <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/8 p-3 text-sm text-danger">{error}</p>
        ) : null}
      </form>
    );
  }

  // Initial form
  return (
    <form className={cardClass} onSubmit={requestOtp}>
      <ProgressBar step={1} />
      <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Sua entrada</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold">Entre no bolão</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Só precisamos do seu nome e WhatsApp para liberar seu acesso com segurança.</p>
      <label className="mt-6 block text-sm font-medium text-muted">
        Nome
        <input
          className={inputClass}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: João Silva"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-muted">
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
      {error ? (
        <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/8 p-3 text-sm text-danger">{error}</p>
      ) : null}
    </form>
  );
}
