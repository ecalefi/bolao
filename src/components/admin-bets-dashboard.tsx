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
  "bg-emerald-700",
  "bg-sky-700",
  "bg-violet-700",
  "bg-rose-700",
  "bg-amber-700",
  "bg-cyan-700",
];

const colorForName = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length] ?? "bg-slate-700";

export function AdminBetsDashboard() {
  const [groupSlug, setGroupSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [otpRequest, setOtpRequest] = useState<AdminOtpRequest | null>(null);
  const [auth, setAuth] = useState<AdminAuth | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
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
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:bg-white focus:ring-2";

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Gestão do grupo</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Ver palpites dos participantes</h2>

      {!otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={requestOtp}>
          <input className={inputClass} placeholder="Slug do grupo" required value={groupSlug} onChange={(e) => setGroupSlug(e.target.value)} />
          <input className={inputClass} placeholder="WhatsApp admin" required value={whatsapp} onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))} />
          <button className="w-full rounded-full bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60" disabled={loading}>{loading ? "Enviando..." : "Enviar código admin"}</button>
        </form>
      ) : null}

      {otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={verifyOtp}>
          <p className="text-sm text-slate-600">Código enviado para {otpRequest.participant.whatsapp}.</p>
          <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-slate-950 outline-none ring-emerald-500 transition focus:bg-white focus:ring-2" maxLength={6} placeholder="000000" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          <button className="w-full rounded-full bg-emerald-700 px-6 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60" disabled={loading}>{loading ? "Verificando..." : "Validar e abrir gestão"}</button>
        </form>
      ) : null}

      {auth ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                {initials(auth.participant.name)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950">{auth.group.name}</p>
                <p className="text-xs text-slate-500">Admin: {auth.participant.name}</p>
              </div>
            </div>
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => loadBets()} disabled={loading}>Atualizar</button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bets.map((bet) => (
              <div key={bet.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${colorForName(bet.participants?.name ?? "?")}`}>
                    {initials(bet.participants?.name ?? "?")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">{bet.participants?.name ?? "-"}</p>
                    <p className="text-xs text-slate-500">{bet.participants?.whatsapp ?? "-"}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{bet.matches?.home_team} x {bet.matches?.away_team}</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">
                  {bet.home_score_prediction} <span className="text-slate-400">×</span> {bet.away_score_prediction}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${bet.status === "pending" ? "bg-yellow-100 text-yellow-800" : bet.status === "hit" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                    {bet.status === "pending" ? "Aguardando" : bet.status === "hit" ? "Acertou" : "Perdeu"}
                  </span>
                  {bet.points != null ? <span className="text-xs font-bold text-slate-600">{bet.points} pts</span> : null}
                </div>
              </div>
            ))}
            {bets.length === 0 ? (
              <div className="col-span-full rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                Nenhum palpite registrado ainda.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
    </section>
  );
}