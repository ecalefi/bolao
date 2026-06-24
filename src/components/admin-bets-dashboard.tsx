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
  "bg-violet-600",
  "bg-sky-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-emerald-600",
];

const colorForName = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length] ?? "bg-slate-600";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const getBetStatusView = (status: string, points: number | null) => {
  if (status === "scored") {
    return {
      label: `${points ?? 0} pts`,
      className: (points ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400",
    };
  }

  if (status === "locked") {
    return {
      label: "Aguardando resultado",
      className: "bg-amber-500/10 text-amber-400",
    };
  }

  return {
    label: "Aguardando jogo",
    className: "bg-violet-500/10 text-violet-300",
  };
};

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
    "w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none ring-violet-500 transition focus:border-violet-500 focus:bg-slate-900 focus:ring-2";

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-xl shadow-violet-900/10 backdrop-blur-sm">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-violet-400">Gestão do grupo</p>
      <h2 className="mt-2 font-display text-2xl text-slate-100">Ver palpites dos participantes</h2>

      {!otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={requestOtp}>
          <input className={inputClass} placeholder="Slug do grupo" required value={groupSlug} onChange={(e) => setGroupSlug(e.target.value)} />
          <input className={inputClass} placeholder="WhatsApp admin" required value={whatsapp} onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))} />
          <button className="w-full cursor-pointer rounded-full bg-rose-500 px-6 py-3 font-display text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
            {loading ? "Enviando..." : "Enviar código admin"}
          </button>
        </form>
      ) : null}

      {otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={verifyOtp}>
          <p className="text-sm text-slate-400">Código enviado para {otpRequest.participant.whatsapp}.</p>
          <input
            className="w-full rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-center font-display text-2xl tracking-[0.35em] text-slate-100 outline-none ring-violet-500 transition focus:bg-slate-900 focus:ring-2"
            maxLength={6}
            placeholder="000000"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button className="w-full cursor-pointer rounded-full bg-rose-500 px-6 py-3 font-display text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
            {loading ? "Verificando..." : "Validar e abrir gestão"}
          </button>
        </form>
      ) : null}

      {auth ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 font-display text-sm text-white shadow-lg shadow-violet-500/30">
                {initials(auth.participant.name)}
              </div>
              <div>
                <p className="font-display text-sm text-slate-100">{auth.group.name}</p>
                <p className="text-xs text-slate-500">Admin: {auth.participant.name}</p>
              </div>
            </div>
            <button
              className="cursor-pointer rounded-full border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-bold text-slate-300 transition-colors duration-200 hover:bg-slate-800 disabled:opacity-60"
              onClick={() => loadBets()}
              disabled={loading}
            >
              Atualizar
            </button>
          </div>

          {prize ? (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-display text-sm uppercase tracking-[0.18em] text-violet-400">Premiação</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Arrecadado: <strong className="text-slate-100">{formatCurrency(prize.totalAmountCents)}</strong> · Pagos: {prize.paidParticipantsCount}
                  </p>
                </div>
                <span className="rounded-full border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300">
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
                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  Prêmio por vencedor: <strong>{formatCurrency(prize.prizePerWinnerCents)}</strong>. Vencedores: {prize.winners.map((winner) => winner.name).join(", ")}.
                </div>
              ) : null}

              {prize.hasNoWinner ? (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                  Nenhum palpite acertou o placar final. O administrador deve decidir se o valor será acumulado ou reembolsado.
                </div>
              ) : null}

              {prize.currentDecision ? (
                <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-200">
                  Decisão registrada: {prize.currentDecision === "rollover" ? `acumular ${formatCurrency(prize.rolloverAmountCents)} para o próximo jogo` : "reembolsar todos os participantes"}.
                </div>
              ) : null}

              {prize.canDecideNoWinner ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    className="cursor-pointer rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-3 font-bold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-60"
                    disabled={loading}
                    onClick={() => decideNoWinner("rollover")}
                  >
                    Acumular para o próximo jogo
                  </button>
                  <button
                    className="cursor-pointer rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-bold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                    disabled={loading}
                    onClick={() => decideNoWinner("refund")}
                  >
                    Reembolso para todos
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bets.map((bet) => {
              const statusView = getBetStatusView(bet.status, bet.points);

              return (
                <div key={bet.id} className="rounded-xl border border-slate-700 bg-slate-900/30 p-4 transition-colors duration-200 hover:border-violet-500/40">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-xs text-white ${colorForName(bet.participants?.name ?? "?")}`}>
                      {initials(bet.participants?.name ?? "?")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm text-slate-100">{bet.participants?.name ?? "-"}</p>
                      <p className="text-xs text-slate-500">{bet.participants?.whatsapp ?? "-"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{bet.matches?.home_team} x {bet.matches?.away_team}</p>
                  <p className="mt-1 font-display text-2xl text-violet-400">
                    {bet.home_score_prediction} <span className="text-slate-600">×</span> {bet.away_score_prediction}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-1 font-display text-xs ${statusView.className}`}>
                      {statusView.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {bets.length === 0 ? (
              <div className="col-span-full rounded-xl bg-slate-900/30 p-6 text-center text-slate-500">
                Nenhum palpite registrado ainda.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">{message}</p> : null}
    </section>
  );
}
