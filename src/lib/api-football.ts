import { env } from "@/lib/env";

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

type ApiFootballResponse<T> = {
  response: T;
  errors?: unknown;
};

export type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

export type ApiFootballEvent = {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
  };
  player: {
    id: number | null;
    name: string | null;
  };
  type: string;
  detail: string;
};

const apiFootballFetch = async <T>(path: string) => {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": env.apiFootballKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status}`);
  }

  return (await response.json()) as ApiFootballResponse<T>;
};

export const getNextBrazilFixtures = async (next = 1) => {
  const data = await apiFootballFetch<ApiFootballFixture[]>(
    `/fixtures?team=${env.apiFootballBrazilTeamId}&next=${next}`,
  );

  return data.response;
};

export const getFixtureById = async (fixtureId: number) => {
  const data = await apiFootballFetch<ApiFootballFixture[]>(`/fixtures?id=${fixtureId}`);

  return data.response[0] ?? null;
};

export const getFixtureEvents = async (fixtureId: number) => {
  const data = await apiFootballFetch<ApiFootballEvent[]>(`/fixtures/events?fixture=${fixtureId}`);

  return data.response;
};

export const isGoalEvent = (event: ApiFootballEvent) =>
  event.type === "Goal" && ["Normal Goal", "Own Goal", "Penalty"].includes(event.detail);

export const buildApiEventKey = (fixtureId: number, event: ApiFootballEvent) =>
  [
    fixtureId,
    event.time.elapsed,
    event.time.extra ?? 0,
    event.team.id,
    event.player.id ?? event.player.name ?? "unknown",
    event.detail,
  ].join(":");
