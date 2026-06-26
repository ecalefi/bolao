"use client";

import { FormEvent, useState } from "react";

type AdminAuth = {
  group: { id: string; name: string; slug: string };
  participant: { id: string; name: string; whatsapp: string };
  session?: { token: string };
};

type AdminOtpRequest = Omit<AdminAuth, "session">;

type BetRow = {
  id: string;
  home_score_prediction: number;
  away_score_prediction: number;
  status: string;
  points: number | null;
  updated_at: string;
  participants: { name: string; whatsapp: string } | null;
  matches: { home_team: string; away_team: string; starts_at: string } | null;
};

type PrizeSummary = {
  totalAmountCents: number;
  paidParticipantsCount: number;
  hasFinishedMatch: boolean;
  hasNoWinner: boolean;
  winners: Array<{ participantId: string; name: string; whatsapp?: string }>;
  winnerCount: number;
  prizePerWinnerCents: number;
  currentDecision: "rollover" | "refund" | null;
  prizeStatus: string;
  rolloverAmountCents: number;
  prizeDecidedAt: string | null;
  canDecideNoWinner: boolean;
};

const safeJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: text };
  }
};

const maskWhatsapp = (value: string) => {
  const digits = value.replace(/\D/g, "").replace(/^55/, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

const avatarColors = [
  "bg-accent",
  "bg-sky-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-success",
  "bg-blue-600",
];

const colorForName = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length] ?? "bg-line";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const getBetStatusView = (status: string, points: number | null) => {
  if (status === "scored") {
    return {
      label: `${points ?? 0} pts`,
      className: (points ?? 0) > 0 ? "bg-success/10 text-success" : "bg-surface-alt text-muted",
    };
  }

  if (status === "locked") {
    return {
      label: "Aguardando resultado",
      className: "bg-warning/10 text-warning",
    };
  }

  return {
    label: "Aguardando jogo",
    className: "bg-accent/8 text-accent",
  };
};

const normalizeSlugInput = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export function AdminBetsDashboard() {
  const [groupSlug, setGroupSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [otpRequest, setOtpRequest] = useState<AdminOtpRequest | null>(null);
  const [auth, setAuth] = useState<AdminAuth | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [prize, setPrize] = useState<PrizeSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/admin/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupSlug, whatsapp }),
    });
    const json = await safeJson(response);
    setLoading(false);
    if (!response.ok) {
      setMessage(String(json.error ?? "Não foi possível enviar o código."));
      return;
    }
    setOtpRequest(json as AdminOtpRequest);
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpRequest) return;
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/admin/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: otpRequest.group.id, participantId: otpRequest.participant.id, code }),
    });
    const json = await safeJson(response);
    setLoading(false);
    if (!response.ok) {
      setMessage(String(json.error ?? "Código inválido."));
      return;
    }
    setAuth(json as AdminAuth);
    await loadBets(json as AdminAuth);
  };

  const loadBets = async (currentAuth = auth) => {
    if (!currentAuth?.session?.token) return;
    setLoading(true);
    setMessage(null);
    const response = await fetch(
      `/api/admin/bets?groupId=${currentAuth.group.id}&adminParticipantId=${currentAuth.participant.id}`,
      { headers: { "x-participant-session": currentAuth.session.token } },
    );
    const json = await safeJson(response);
    setLoading(false);
    if (!response.ok) {
      setMessage(String(json.error ?? "Não foi possível carregar palpites."));
      return;
    }
    setBets((json.bets as BetRow[]) ?? []);
    setPrize((json.prize as PrizeSummary) ?? null);
  };

  const decideNoWinner = async (decision: "rollover" | "refund") => {
    if (!auth?.session?.token) return;

    const confirmed = window.confirm(
      decision === "rollover"
        ? "Confirmar que o valor será acumulado para o próximo jogo?"
        : "Confirmar que todos os participantes deverão ser reembolsados?",
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/prize-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-participant-session": auth.session.token,
      },
      body: JSON.stringify({
        groupId: auth.group.id,
        adminParticipantId: auth.participant.id,
        decision,
      }),
    });
    const json = await safeJson(response);
    setLoading(false);

    if (!response.ok) {
      setMessage(String(json.error ?? "Não foi possível registrar a decisão."));
      return;
    }

    setPrize((json.prize as PrizeSummary) ?? null);
    setMessage(decision === "rollover" ? "Decisão registrada: valor acumulado." : "Decisão registrada: reembolso para todos.");
  };

  const inputClass =
    "field-focus w-full rounded-2xl border border-line bg-surface-alt px-4 py-3 text-fg placeholder:text-muted";

  return (
    <section className="sport-card rounded-[1.75rem] p-5 sm:p-6">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Entrada do admin</p>
      <h2 className="mt-2 font-display text-2xl font-extrabold text-fg">Entrar no painel do bolão</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Use o <strong className="text-fg">slug do bolão</strong> e o <strong className="text-fg">WhatsApp cadastrado como admin</strong>. Vamos enviar um código antes de liberar os palpites.
      </p>

      {!otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={requestOtp}>
          <label className="block text-sm font-medium text-muted" htmlFor="admin-group-slug">
            Slug do bolão
            <input
              aria-describedby="admin-group-slug-help"
              autoComplete="off"
              className={`${inputClass} mt-2`}
              id="admin-group-slug"
              placeholder="Ex.: familia-copa"
              required
              value={groupSlug}
              onChange={(e) => setGroupSlug(normalizeSlugInput(e.target.value))}
            />
            <span className="mt-2 block text-xs leading-5 text-muted" id="admin-group-slug-help">
              É o nome curto que aparece no link do bolão: <strong className="text-accent">/bolao/seu-slug</strong>.
            </span>
          </label>
          <label className="block text-sm font-medium text-muted" htmlFor="admin-whatsapp">
            WhatsApp do admin
            <input
              autoComplete="tel"
              className={`${inputClass} mt-2`}
              id="admin-whatsapp"
              inputMode="tel"
              placeholder="Ex.: 11 99999-9999"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
            />
          </label>
          <button className="min-h-12 w-full cursor-pointer rounded-full bg-accent px-6 py-3 font-display text-base font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading}>
            {loading ? "Enviando código..." : "Entrar com código admin"}
          </button>
        </form>
      ) : null}

      {otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={verifyOtp}>
          <p className="text-sm text-muted">Código enviado para {otpRequest.participant.whatsapp}.</p>
          <input
            className="field-focus w-full rounded-2xl border border-line bg-surface-alt px-4 py-3 text-center font-display text-2xl font-bold tracking-[0.35em] text-fg"
            maxLength={6}
            placeholder="000000"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button className="min-h-12 w-full cursor-pointer rounded-full bg-accent px-6 py-3 font-display text-base font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading}>
            {loading ? "Verificando..." : "Validar e abrir gestão"}
          </button>
        </form>
      ) : null}

      {auth ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-white shadow-sm">
                {initials(auth.participant.name)}
              </div>
              <div>
                <p className="font-display text-sm font-bold text-fg">{auth.group.name}</p>
                <p className="text-xs text-muted">Admin: {auth.participant.name}</p>
              </div>
            </div>
            <button
              className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm font-bold text-muted transition-colors duration-200 hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              onClick={() => loadBets()}
              disabled={loading}
            >
              Atualizar
            </button>
          </div>

          {prize ? (
            <div className="mt-5 rounded-2xl border border-line bg-surface-alt p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-accent">Premiação</p>
                  <p className="mt-1 text-sm text-muted">
                    Arrecadado: <strong className="text-fg">{formatCurrency(prize.totalAmountCents)}</strong> · Pagos: {prize.paidParticipantsCount}
                  </p>
                </div>
                <span className="rounded-full border border-line px-3 py-1 text-xs font-bold text-muted">
                  {prize.prizeStatus === "rolled_over"
                    ? "Acumulado"
                    : prize.prizeStatus === "refunded"
                      ? "Reembolso definido"
                      : prize.hasNoWinner
                        ? "Sem vencedor"
                        : prize.winnerCount > 0
                          ? `${prize.winnerCount} vencedor(es)`
                          : "Aguardando resultado"}
                </span>
              </div>

              {prize.winnerCount > 0 ? (
                <div className="mt-4 rounded-2xl border border-success/20 bg-success/10 p-3 text-sm text-success">
                  Prêmio por vencedor: <strong>{formatCurrency(prize.prizePerWinnerCents)}</strong>. Vencedores: {prize.winners.map((winner) => winner.name).join(", ")}.
                </div>
              ) : null}

              {prize.hasNoWinner ? (
                <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
                  Nenhum palpite acertou o placar final. O administrador deve decidir se o valor será acumulado ou reembolsado.
                </div>
              ) : null}

              {prize.currentDecision ? (
                <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 p-3 text-sm text-accent">
                  Decisão registrada: {prize.currentDecision === "rollover" ? `acumular ${formatCurrency(prize.rolloverAmountCents)} para o próximo jogo` : "reembolsar todos os participantes"}.
                </div>
              ) : null}

              {prize.canDecideNoWinner ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    className="cursor-pointer rounded-full border border-accent/25 bg-accent/8 px-4 py-3 font-bold text-accent transition hover:bg-accent/15 disabled:opacity-50"
                    disabled={loading}
                    onClick={() => decideNoWinner("rollover")}
                  >
                    Acumular para o próximo jogo
                  </button>
                  <button
                    className="cursor-pointer rounded-full border border-danger/25 bg-danger/8 px-4 py-3 font-bold text-danger transition hover:bg-danger/15 disabled:opacity-50"
                    disabled={loading}
                    onClick={() => decideNoWinner("refund")}
                  >
                    Reembolso para todos
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bets.map((bet) => {
              const statusView = getBetStatusView(bet.status, bet.points);

              return (
                <div key={bet.id} className="rounded-2xl border border-line bg-surface p-4 transition-shadow duration-200 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-xs font-bold text-white ${colorForName(bet.participants?.name ?? "?")}`}>
                      {initials(bet.participants?.name ?? "?")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-fg">{bet.participants?.name ?? "-"}</p>
                      <p className="text-xs text-muted">{bet.participants?.whatsapp ?? "-"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted">{bet.matches?.home_team} x {bet.matches?.away_team}</p>
                  <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-accent">
                    {bet.home_score_prediction} <span className="text-muted">×</span> {bet.away_score_prediction}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-1 font-display text-xs font-bold ${statusView.className}`}>
                      {statusView.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {bets.length === 0 ? (
              <div className="col-span-full rounded-2xl bg-surface-alt p-6 text-center text-muted">
                Nenhum palpite registrado ainda.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-2xl border border-danger/20 bg-danger/8 p-3 text-sm leading-6 text-danger">
          {message}
          <span className="mt-1 block text-xs text-danger/80">
            Confira se o slug é exatamente o mesmo do link e se o WhatsApp é o número cadastrado ao criar o bolão.
          </span>
        </p>
      ) : null}
    </section>
  );
}
