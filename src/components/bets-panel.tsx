"use client";

import { useEffect, useMemo, useState } from "react";

type Match = {
  id: string;
  home_team: string;
  away_team: string;
  starts_at: string;
  status: string;
};

type Bet = {
  id: string;
  match_id: string;
  participant_id?: string;
  participant_name?: string;
  home_score_prediction: number;
  away_score_prediction: number;
  status: string;
  points: number | null;
  updated_at?: string;
};

type MatchPayload = {
  matches: Match[];
  bets: Bet[];
  allBets?: Bet[];
  error?: string;
};

type BetPayload = {
  bet?: Bet;
  error?: string;
};

const safeReadJson = async (response: Response): Promise<MatchPayload> => {
  const text = await response.text();

  if (!text) return { matches: [], bets: [] };

  try {
    return JSON.parse(text) as MatchPayload;
  } catch {
    return { matches: [], bets: [], error: text } satisfies MatchPayload;
  }
};

const safeReadBetJson = async (response: Response): Promise<BetPayload> => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as BetPayload;
  } catch {
    return { error: text };
  }
};

export function BetsPanel({
  groupId,
  participantId,
  sessionToken,
}: {
  groupId: string;
  participantId: string;
  sessionToken: string;
}) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const betsByMatch = useMemo(
    () => Object.fromEntries(bets.map((bet) => [bet.match_id, bet])),
    [bets],
  );

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        setMessage(null);
        const response = await fetch(`/api/groups/matches?groupId=${groupId}&participantId=${participantId}`, {
          headers: { "x-participant-session": sessionToken },
        });
        const json = await safeReadJson(response);

        if (!response.ok) {
          setMessage(json.error ?? "Não foi possível carregar os jogos.");
          return;
        }

        setMatches(json.matches ?? []);
        setBets(json.bets ?? []);
        setAllBets(json.allBets ?? []);
        setPredictions(
          Object.fromEntries(
            (json.matches ?? []).map((match) => {
              const bet = (json.bets ?? []).find((item) => item.match_id === match.id);
              return [
                match.id,
                {
                  home: bet ? String(bet.home_score_prediction) : "",
                  away: bet ? String(bet.away_score_prediction) : "",
                },
              ];
            }),
          ),
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Não foi possível carregar os jogos.");
      } finally {
        setLoading(false);
      }
    };

    void loadMatches();
  }, [groupId, participantId, sessionToken]);

  const saveBet = async (match: Match) => {
    const prediction = predictions[match.id];

    if (!prediction?.home || !prediction?.away) {
      setMessage("Informe os dois placares.");
      return;
    }

    setMessage(null);
    setSavingMatchId(match.id);
    const response = await fetch("/api/bets", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-participant-session": sessionToken },
      body: JSON.stringify({
        groupId,
        participantId,
        matchId: match.id,
        homeScorePrediction: Number(prediction.home),
        awayScorePrediction: Number(prediction.away),
      }),
    });
    const json = await safeReadBetJson(response);
    setSavingMatchId(null);

    if (!response.ok) {
      setMessage(json.error ?? "Não foi possível salvar o palpite.");
      return;
    }

    if (!json.bet) {
      setMessage("Palpite não foi retornado pelo servidor.");
      return;
    }

    setBets((current) => [...current.filter((bet) => bet.match_id !== match.id), json.bet as Bet]);
    setAllBets((current) => [
      {
        ...(json.bet as Bet),
        participant_id: participantId,
        participant_name: "Você",
        updated_at: new Date().toISOString(),
      },
      ...current.filter((bet) => bet.id !== json.bet?.id),
    ]);
    setMessage("Palpite salvo com sucesso!");
  };

  if (loading) {
    return (
      <div className="mt-5 animate-pulse space-y-3">
        <div className="h-6 w-32 rounded bg-slate-700" />
        <div className="h-32 rounded-xl bg-slate-800" />
      </div>
    );
  }

  return (
    <section className="mt-6 border-t border-slate-700 pt-6">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-violet-400">Palpite liberado</p>
      <h3 className="mt-2 font-display text-xl">Escolha o placar do jogo</h3>

      <div className="mt-4 space-y-4">
        {matches.map((match) => {
          const startsAt = new Date(match.starts_at);
          const currentBet = betsByMatch[match.id];

          return (
            <article
              className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-rose-500/5 p-4"
              key={match.id}
            >
              <p className="font-display text-sm text-violet-400">
                {startsAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
              <h4 className="mt-2 font-display text-xl">
                {match.home_team} <span className="text-slate-500">×</span> {match.away_team}
              </h4>
              <div className="mt-4 flex items-center justify-center gap-3">
                <input
                  aria-label={`Gols ${match.home_team}`}
                  className="h-16 w-24 rounded-xl border border-slate-600 bg-slate-900/50 px-3 text-center font-display text-2xl text-slate-100 shadow-lg outline-none ring-violet-500 transition focus:ring-2"
                  min={0}
                  max={20}
                  type="number"
                  value={predictions[match.id]?.home ?? ""}
                  onChange={(event) =>
                    setPredictions((current) => ({
                      ...current,
                      [match.id]: { home: event.target.value, away: current[match.id]?.away ?? "" },
                    }))
                  }
                />
                <span className="font-display text-violet-500">×</span>
                <input
                  aria-label={`Gols ${match.away_team}`}
                  className="h-16 w-24 rounded-xl border border-slate-600 bg-slate-900/50 px-3 text-center font-display text-2xl text-slate-100 shadow-lg outline-none ring-violet-500 transition focus:ring-2"
                  min={0}
                  max={20}
                  type="number"
                  value={predictions[match.id]?.away ?? ""}
                  onChange={(event) =>
                    setPredictions((current) => ({
                      ...current,
                      [match.id]: { home: current[match.id]?.home ?? "", away: event.target.value },
                    }))
                  }
                />
              </div>
              <button
                className="mt-5 w-full cursor-pointer rounded-full bg-rose-500 px-6 py-4 font-display text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingMatchId === match.id}
                onClick={() => saveBet(match)}
              >
                {savingMatchId === match.id ? "Salvando..." : currentBet ? "Atualizar palpite" : "Salvar palpite"}
              </button>
              {currentBet ? <p className="mt-3 text-sm text-emerald-400">Palpite registrado.</p> : null}
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-violet-400">Palpites do grupo</p>
            <h3 className="mt-1 font-display text-lg">Veja como a galera apostou</h3>
          </div>
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-400">
            {allBets.length} {allBets.length === 1 ? "palpite" : "palpites"}
          </span>
        </div>

        {allBets.length > 0 ? (
          <div className="mt-4 space-y-2">
            {allBets.map((bet) => {
              const match = matches.find((item) => item.id === bet.match_id);
              const isMine = bet.participant_id === participantId;

              return (
                <div
                  className={`flex items-center justify-between gap-3 rounded-xl p-3 ring-1 transition-all duration-200 ${
                    isMine
                      ? "bg-violet-500/15 ring-violet-500/40"
                      : "bg-slate-900/30 ring-slate-700"
                  }`}
                  key={bet.id}
                >
                  <div className="flex items-center gap-2">
                    {isMine ? (
                      <span className="rounded-full bg-violet-600 px-2 py-0.5 font-display text-xs text-white">Você</span>
                    ) : null}
                    <div>
                      <p className={`font-bold ${isMine ? "text-violet-300" : "text-slate-200"}`}>{bet.participant_name ?? "Participante"}</p>
                      <p className="text-xs text-slate-500">{match ? `${match.home_team} x ${match.away_team}` : "Jogo do grupo"}</p>
                    </div>
                  </div>
                  <div className={`rounded-lg px-4 py-2 font-display text-lg shadow-sm ${isMine ? "bg-violet-600 text-white" : "bg-slate-800 text-violet-300"}`}>
                    {bet.home_score_prediction} <span className="text-slate-500">×</span> {bet.away_score_prediction}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-900/30 p-3 text-sm text-slate-500">
            Seja o primeiro a registrar um palpite neste grupo.
          </p>
        )}
      </div>

      {message ? <p className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-sm text-violet-300">{message}</p> : null}
    </section>
  );
}