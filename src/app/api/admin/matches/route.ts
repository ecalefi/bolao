import { z } from "zod";
import { getFixtureById } from "@/lib/api-football";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const createManualMatchSchema = z.object({
  groupSlug: z.string().trim().min(3),
  homeTeam: z.string().trim().min(2).optional(),
  awayTeam: z.string().trim().min(2).optional(),
  startsAt: z.string().datetime().optional(),
  apiFootballFixtureId: z.coerce.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createManualMatchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { groupSlug, homeTeam, awayTeam, startsAt, apiFootballFixtureId } = parsed.data;

    const { data: group, error: groupError } = await supabase
      .from("betting_groups")
      .select("id,name,slug")
      .eq("slug", groupSlug)
      .single();

    if (groupError || !group) {
      return Response.json({ error: "Grupo não encontrado." }, { status: 404 });
    }

    const fixture = apiFootballFixtureId ? await getFixtureById(apiFootballFixtureId) : null;

    if (!fixture && (!homeTeam || !awayTeam || !startsAt)) {
      return Response.json(
        { error: "Selecione um jogo disponível ou preencha mandante, visitante e data/hora manualmente." },
        { status: 400 },
      );
    }

    const fixtureId = fixture?.fixture.id ?? apiFootballFixtureId ?? -Date.now();

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .upsert(
        {
          api_football_fixture_id: fixtureId,
          home_team_id: fixture?.teams.home.id ?? null,
          away_team_id: fixture?.teams.away.id ?? null,
          home_team: fixture?.teams.home.name ?? homeTeam,
          away_team: fixture?.teams.away.name ?? awayTeam,
          starts_at: fixture?.fixture.date ?? startsAt,
          status: fixture?.fixture.status.short ?? "scheduled",
          home_score: fixture?.goals.home ?? 0,
          away_score: fixture?.goals.away ?? 0,
          elapsed: fixture?.fixture.status.elapsed ?? null,
          last_synced_at: fixture ? new Date().toISOString() : null,
          raw_payload: fixture ?? { source: "manual_admin" },
        },
        { onConflict: "api_football_fixture_id" },
      )
      .select("id,api_football_fixture_id,home_team,away_team,starts_at,status")
      .single();

    if (matchError || !match) {
      return Response.json({ error: matchError?.message ?? "Erro ao criar jogo." }, { status: 500 });
    }

    const { error: linkError } = await supabase.from("group_matches").upsert(
      {
        group_id: group.id,
        match_id: match.id,
      },
      { onConflict: "group_id,match_id" },
    );

    if (linkError) {
      return Response.json({ error: linkError.message }, { status: 500 });
    }

    return Response.json({ group, match });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao cadastrar jogo.";
    return Response.json({ error: message }, { status: 500 });
  }
}
