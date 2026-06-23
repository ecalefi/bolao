import { NextRequest } from "next/server";
import { getNextBrazilFixtures } from "@/lib/api-football";
import { env } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const isAuthorized = (request: NextRequest) =>
  request.headers.get("authorization") === `Bearer ${env.cronSecret}`;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fixtures = await getNextBrazilFixtures(3);
  const supabase = createSupabaseAdmin();

  const rows = fixtures.map((fixture) => ({
    api_football_fixture_id: fixture.fixture.id,
    home_team_id: fixture.teams.home.id,
    away_team_id: fixture.teams.away.id,
    home_team: fixture.teams.home.name,
    away_team: fixture.teams.away.name,
    starts_at: fixture.fixture.date,
    status: fixture.fixture.status.short,
    home_score: fixture.goals.home ?? 0,
    away_score: fixture.goals.away ?? 0,
    elapsed: fixture.fixture.status.elapsed,
    last_synced_at: new Date().toISOString(),
    raw_payload: fixture,
  }));

  const { data, error } = await supabase
    .from("matches")
    .upsert(rows, { onConflict: "api_football_fixture_id" })
    .select("id,api_football_fixture_id,home_team,away_team,starts_at,status");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ matches: data });
}
