import { NextRequest } from "next/server";
import { requireParticipantSession } from "@/lib/auth";
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

    const matches = typedExistingMatches.flatMap((row) => {
      if (!row.matches) return [];
      return Array.isArray(row.matches) ? row.matches : [row.matches];
    });

    if (matches.length === 0) {
      return Response.json({ error: "O administrador ainda não escolheu o jogo deste grupo." }, { status: 404 });
    }

    const { data: bets } = participantId
      ? await supabase
          .from("bets")
          .select("id,match_id,home_score_prediction,away_score_prediction,status,points")
          .eq("group_id", groupId)
          .eq("participant_id", participantId)
      : { data: [] };

    const { data: allBets, error: allBetsError } = await supabase
      .from("bets")
      .select("id,match_id,participant_id,home_score_prediction,away_score_prediction,status,points,updated_at,participants(name)")
      .eq("group_id", groupId)
      .order("updated_at", { ascending: false });

    if (allBetsError) {
      return Response.json({ error: allBetsError.message }, { status: 500 });
    }

    const typedAllBets = (allBets ?? []) as unknown as Array<{
      id: string;
      match_id: string;
      participant_id: string;
      home_score_prediction: number;
      away_score_prediction: number;
      status: string;
      points: number | null;
      updated_at: string;
      participants: { name: string } | { name: string }[] | null;
    }>;

    const publicBets = typedAllBets.map((bet) => {
      const participant = Array.isArray(bet.participants) ? bet.participants[0] : bet.participants;

      return {
        id: bet.id,
        match_id: bet.match_id,
        participant_id: bet.participant_id,
        participant_name: participant?.name ?? "Participante",
        home_score_prediction: bet.home_score_prediction,
        away_score_prediction: bet.away_score_prediction,
        status: bet.status,
        points: bet.points,
        updated_at: bet.updated_at,
      };
    });

    return Response.json({ matches, bets: bets ?? [], allBets: publicBets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar jogos.";

    return Response.json({ error: message }, { status: 500 });
  }
}
