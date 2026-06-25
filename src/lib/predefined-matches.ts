export type PredefinedMatch = {
  fixtureId: number;
  startsAt: string;
  status: string;
  league: {
    id: number;
    name: string;
    country: string;
    round: string;
    season: number;
  };
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
};

const PREDEFINED_MATCHES: PredefinedMatch[] = [
  {
    fixtureId: -202606291400,
    startsAt: "2026-06-29T14:00:00-03:00",
    status: "scheduled",
    league: {
      id: -1,
      name: "Jogo do dia",
      country: "Internacional",
      round: "Rodada especial",
      season: 2026,
    },
    homeTeam: { id: -101, name: "Brasil" },
    awayTeam: { id: -102, name: "Japão" },
  },
];

const dateInSaoPaulo = (isoDate: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoDate));

export const getPredefinedMatchesByDate = (date: string) =>
  PREDEFINED_MATCHES.filter((match) => dateInSaoPaulo(match.startsAt) === date);

export const getPredefinedMatchByFixtureId = (fixtureId: number) =>
  PREDEFINED_MATCHES.find((match) => match.fixtureId === fixtureId) ?? null;
