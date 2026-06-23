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
  home_score_prediction: number;
  away_score_prediction: number;
  status: string;
  points: number | null;
};

type MatchPayload = {
  matches: Match[];
  bets: Bet[];
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
    const json = await response.json();
    setSavingMatchId(null);

    if (!response.ok) {
      setMessage(json.error ?? "Não foi possível salvar o palpite.");
      return;
    }

    setBets((current) => [
      ...current.filter((bet) => bet.match_id !== match.id),
      { ...json.bet, match_id: match.id, status: "open", points: null },
    ]);
    setMessage("Palpite salvo com sucesso!");
  };

  if (loading) {
    return <p className="mt-5 text-sm text-slate-600">Carregando jogos do Brasil...</p>;
  }

  return (
    <section className="mt-6 border-t border-slate-100 pt-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Palpites liberados</p>
      <h3 className="mt-2 text-xl font-bold text-slate-950">Próximos jogos do Brasil</h3>

      <div className="mt-4 space-y-4">
        {matches.map((match) => {
          const startsAt = new Date(match.starts_at);
          const currentBet = betsByMatch[match.id];

          return (
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={match.id}>
              <p className="text-sm text-slate-500">
                {startsAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
              <h4 className="mt-1 text-lg font-bold text-slate-950">
                {match.home_team} x {match.away_team}
              </h4>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
                  min={0}
                  type="number"
                  value={predictions[match.id]?.home ?? ""}
                  onChange={(event) =>
                    setPredictions((current) => ({
                      ...current,
                      [match.id]: { home: event.target.value, away: current[match.id]?.away ?? "" },
                    }))
                  }
                />
                <span className="font-bold text-slate-500">x</span>
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold text-slate-950 outline-none ring-emerald-500 focus:ring-2"
                  min={0}
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
                className="mt-4 w-full rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
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

      {message ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
    </section>
  );
}
