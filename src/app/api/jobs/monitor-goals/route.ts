import { NextRequest } from "next/server";
import { buildApiEventKey, getFixtureById, getFixtureEvents, isGoalEvent } from "@/lib/api-football";
import { env } from "@/lib/env";
import { formatMatchTitle } from "@/lib/format";
import { dispatchN8nEvent } from "@/lib/n8n";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const isAuthorized = (request: NextRequest) =>
  request.headers.get("authorization") === `Bearer ${env.cronSecret}`;

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const fixtureIdParam = url.searchParams.get("fixtureId");

  if (!fixtureIdParam) {
    return Response.json({ error: "fixtureId é obrigatório." }, { status: 400 });
  }

  const fixtureId = Number(fixtureIdParam);
  const [fixture, events] = await Promise.all([getFixtureById(fixtureId), getFixtureEvents(fixtureId)]);

  if (!fixture) {
    return Response.json({ error: "Fixture não encontrado." }, { status: 404 });
  }

  const supabase = createSupabaseAdmin();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .upsert(
      {
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
      },
      { onConflict: "api_football_fixture_id" },
    )
    .select("id,home_team,away_team,home_score,away_score")
    .single();

  if (matchError || !match) {
    return Response.json({ error: matchError?.message ?? "Erro ao salvar jogo." }, { status: 500 });
  }

  const goalEvents = events.filter(isGoalEvent);
  const newGoals = [];

  for (const event of goalEvents) {
    const apiEventKey = buildApiEventKey(fixtureId, event);
    const { data: insertedEvent, error } = await supabase
      .from("match_events")
      .insert({
        match_id: match.id,
        api_event_key: apiEventKey,
        event_type: event.type,
        detail: event.detail,
        team_id: event.team.id,
        team_name: event.team.name,
        player_name: event.player.name,
        elapsed: event.time.elapsed,
        extra_time: event.time.extra,
        home_score_snapshot: fixture.goals.home ?? 0,
        away_score_snapshot: fixture.goals.away ?? 0,
        raw_payload: event,
      })
      .select("id,team_name,player_name,elapsed,detail")
      .single();

    if (error?.code === "23505") {
      continue;
    }

    if (error || !insertedEvent) {
      throw new Error(error?.message ?? "Erro ao salvar evento de gol.");
    }

    const { data: groupMatches } = await supabase
      .from("group_matches")
      .select("group_id,betting_groups(name)")
      .eq("match_id", match.id);

    const typedGroupMatches = (groupMatches ?? []) as unknown as Array<{
      group_id: string;
      betting_groups: { name: string } | null;
    }>;

    for (const groupMatch of typedGroupMatches) {
      await dispatchN8nEvent("goal_detected", {
        groupId: groupMatch.group_id,
        groupName: groupMatch.betting_groups?.name,
        match: formatMatchTitle(match.home_team, match.away_team),
        team: insertedEvent.team_name,
        player: insertedEvent.player_name,
        minute: insertedEvent.elapsed,
        detail: insertedEvent.detail,
        score: `${match.home_team} ${fixture.goals.home ?? 0} x ${fixture.goals.away ?? 0} ${match.away_team}`,
      });
    }

    await supabase
      .from("match_events")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", insertedEvent.id);

    newGoals.push(insertedEvent);
  }

  return Response.json({ goalsDetected: newGoals.length, goals: newGoals });
}
