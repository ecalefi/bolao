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

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Gestão do grupo</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Ver palpites dos participantes</h2>

      {!otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={requestOtp}>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950" placeholder="Slug do grupo" required value={groupSlug} onChange={(e) => setGroupSlug(e.target.value)} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-950" placeholder="WhatsApp admin" required value={whatsapp} onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))} />
          <button className="w-full rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white" disabled={loading}>{loading ? "Enviando..." : "Enviar código admin"}</button>
        </form>
      ) : null}

      {otpRequest && !auth ? (
        <form className="mt-5 space-y-4" onSubmit={verifyOtp}>
          <p className="text-sm text-slate-600">Código enviado para {otpRequest.participant.whatsapp}.</p>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-slate-950" maxLength={6} placeholder="000000" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          <button className="w-full rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white" disabled={loading}>{loading ? "Verificando..." : "Validar e abrir gestão"}</button>
        </form>
      ) : null}

      {auth ? (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Grupo: <strong>{auth.group.name}</strong></p>
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => loadBets()} disabled={loading}>Atualizar</button>
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Participante</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">Jogo</th>
                  <th className="p-3">Palpite</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {bets.map((bet) => (
                  <tr key={bet.id}>
                    <td className="p-3 font-semibold">{bet.participants?.name ?? "-"}</td>
                    <td className="p-3">{bet.participants?.whatsapp ?? "-"}</td>
                    <td className="p-3">{bet.matches?.home_team} x {bet.matches?.away_team}</td>
                    <td className="p-3 font-bold">{bet.home_score_prediction} x {bet.away_score_prediction}</td>
                    <td className="p-3">{bet.status}</td>
                    <td className="p-3">{new Date(bet.updated_at).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
                {bets.length === 0 ? <tr><td className="p-4 text-slate-500" colSpan={6}>Nenhum palpite registrado ainda.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}
    </section>
  );
}
