import { NextRequest } from "next/server";
import { getFixturesByDate } from "@/lib/api-football";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const todayInSaoPaulo = () => dateFormatter.format(new Date());

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? todayInSaoPaulo();
    const fixtures = await getFixturesByDate(date);

    const matches = fixtures
      .filter((fixture) => ["TBD", "NS", "1H", "HT", "2H", "ET", "BT", "P"].includes(fixture.fixture.status.short))
      .map((fixture) => ({
        fixtureId: fixture.fixture.id,
        startsAt: fixture.fixture.date,
        status: fixture.fixture.status.short,
        league: fixture.league
          ? {
              id: fixture.league.id,
              name: fixture.league.name,
              country: fixture.league.country,
              round: fixture.league.round,
              season: fixture.league.season,
            }
          : null,
        homeTeam: {
          id: fixture.teams.home.id,
          name: fixture.teams.home.name,
        },
        awayTeam: {
          id: fixture.teams.away.id,
          name: fixture.teams.away.name,
        },
      }))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    return Response.json({ date, matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar jogos disponíveis.";
    return Response.json({ error: message }, { status: 500 });
  }
}
