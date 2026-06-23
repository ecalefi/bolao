import { NextRequest } from "next/server";
import { requireParticipantSession } from "@/lib/auth";
import { getNextBrazilFixtures } from "@/lib/api-football";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId");
    const participantId = request.nextUrl.searchParams.get("participantId");

    if (!groupId) {
      return Response.json({ error: "groupId é obrigatório." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    if (participantId) {
      await requireParticipantSession(participantId, request.headers.get("x-participant-session"));
    }

    const { data: existingMatches, error: existingMatchesError } = await supabase
      .from("group_matches")
      .select("matches(id,api_football_fixture_id,home_team,away_team,starts_at,status,home_score,away_score)")
      .eq("group_id", groupId);

    if (existingMatchesError) {
      return Response.json({ error: existingMatchesError.message }, { status: 500 });
    }

  type MatchRow = {
    id: string;
    api_football_fixture_id: number;
    home_team: string;
    away_team: string;
    starts_at: string;
    status: string;
    home_score: number;
    away_score: number;
  };

    const typedExistingMatches = (existingMatches ?? []) as unknown as Array<{
      matches: MatchRow | MatchRow[] | null;
    }>;

    let matches = typedExistingMatches.flatMap((row) => {
      if (!row.matches) return [];
      return Array.isArray(row.matches) ? row.matches : [row.matches];
    });

    if (matches.length === 0) {
      const fixtures = await getNextBrazilFixtures(1);
      const fixture = fixtures[0];

      if (!fixture) {
        return Response.json({ error: "Nenhum próximo jogo do Brasil encontrado." }, { status: 404 });
      }

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
        .select("id,api_football_fixture_id,home_team,away_team,starts_at,status,home_score,away_score")
        .single();

      if (matchError || !match) {
        return Response.json({ error: matchError?.message ?? "Erro ao criar jogo." }, { status: 500 });
      }

      await supabase.from("group_matches").upsert(
        {
          group_id: groupId,
          match_id: match.id,
        },
        { onConflict: "group_id,match_id" },
      );

      matches = [match];
    }

    const { data: bets } = participantId
      ? await supabase
          .from("bets")
          .select("id,match_id,home_score_prediction,away_score_prediction,status,points")
          .eq("group_id", groupId)
          .eq("participant_id", participantId)
      : { data: [] };

    return Response.json({ matches, bets: bets ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar jogos.";

    return Response.json({ error: message }, { status: 500 });
  }
}
