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
    return <p className="mt-5 text-sm text-slate-600">Carregando jogo do grupo...</p>;
  }

  return (
    <section className="mt-6 border-t border-slate-100 pt-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Palpite liberado</p>
      <h3 className="mt-2 text-xl font-black text-slate-950">Escolha o placar do jogo</h3>

      <div className="mt-4 space-y-4">
        {matches.map((match) => {
          const startsAt = new Date(match.starts_at);
          const currentBet = betsByMatch[match.id];

          return (
            <article className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-yellow-50 p-4" key={match.id}>
              <p className="text-sm font-semibold text-emerald-700">
                {startsAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
              <h4 className="mt-2 text-xl font-black text-slate-950">
                {match.home_team} x {match.away_team}
              </h4>
              <div className="mt-4 flex items-center justify-center gap-3">
                <input
                  aria-label={`Gols ${match.home_team}`}
                  className="h-16 w-24 rounded-2xl border border-white bg-white px-3 text-center text-2xl font-black text-slate-950 shadow-sm outline-none ring-emerald-500 focus:ring-2"
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
                <span className="font-black text-emerald-700">x</span>
                <input
                  aria-label={`Gols ${match.away_team}`}
                  className="h-16 w-24 rounded-2xl border border-white bg-white px-3 text-center text-2xl font-black text-slate-950 shadow-sm outline-none ring-emerald-500 focus:ring-2"
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
                className="mt-5 w-full rounded-full bg-emerald-700 px-6 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-60"
                disabled={savingMatchId === match.id}
                onClick={() => saveBet(match)}
              >
                {savingMatchId === match.id ? "Salvando..." : currentBet ? "Atualizar palpite" : "Salvar palpite"}
              </button>
              {currentBet ? <p className="mt-3 text-sm text-emerald-700">Palpite registrado.</p> : null}
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-emerald-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Palpites do grupo</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Veja como a galera apostou</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
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
                  className={`flex items-center justify-between gap-3 rounded-2xl p-3 ring-1 transition ${
                    isMine
                      ? "bg-emerald-100 ring-emerald-300"
                      : "bg-slate-50 ring-transparent"
                  }`}
                  key={bet.id}
                >
                  <div className="flex items-center gap-2">
                    {isMine ? (
                      <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-bold text-white">Você</span>
                    ) : null}
                    <div>
                      <p className={`font-bold ${isMine ? "text-emerald-800" : "text-slate-950"}`}>{bet.participant_name ?? "Participante"}</p>
                      <p className="text-xs text-slate-500">{match ? `${match.home_team} x ${match.away_team}` : "Jogo do grupo"}</p>
                    </div>
                  </div>
                  <div className={`rounded-2xl px-4 py-2 text-lg font-black shadow-sm ${isMine ? "bg-emerald-700 text-white" : "bg-white text-emerald-800"}`}>
                    {bet.home_score_prediction} x {bet.away_score_prediction}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            Seja o primeiro a registrar um palpite neste grupo.
          </p>
        )}
      </div>

      {message ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
    </section>
  );
}
