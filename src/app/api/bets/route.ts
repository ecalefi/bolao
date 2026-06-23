import { getSessionTokenFromRequest, requireParticipantSession } from "@/lib/auth";
import { dispatchN8nEvent } from "@/lib/n8n";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { upsertBetSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = upsertBetSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { groupId, participantId, matchId, homeScorePrediction, awayScorePrediction } = parsed.data;

    await requireParticipantSession(participantId, getSessionTokenFromRequest(request));

    const { data: member } = await supabase
      .from("group_members")
      .select("status")
      .eq("group_id", groupId)
      .eq("participant_id", participantId)
      .maybeSingle();

    if (member?.status !== "paid") {
      return Response.json({ error: "Pagamento pendente. Palpite bloqueado." }, { status: 403 });
    }

    const { data: groupMatch } = await supabase
      .from("group_matches")
      .select("group_id,match_id")
      .eq("group_id", groupId)
      .eq("match_id", matchId)
      .maybeSingle();

    if (!groupMatch) {
      return Response.json({ error: "Jogo não pertence a este grupo." }, { status: 404 });
    }

    const [{ data: group }, { data: match }, { data: participant }] = await Promise.all([
      supabase
        .from("betting_groups")
        .select("name,bet_lock_minutes_before_match")
        .eq("id", groupId)
        .single(),
      supabase
        .from("matches")
        .select("id,home_team,away_team,starts_at")
        .eq("id", matchId)
        .single(),
      supabase
        .from("participants")
        .select("name,whatsapp")
        .eq("id", participantId)
        .single(),
    ]);

    if (!group || !match) {
      return Response.json({ error: "Grupo ou jogo não encontrado." }, { status: 404 });
    }

    const lockMinutes = group.bet_lock_minutes_before_match ?? 5;
    const lockTime = new Date(new Date(match.starts_at).getTime() - lockMinutes * 60_000);

    if (new Date() >= lockTime) {
      return Response.json({ error: "Palpites encerrados para este jogo." }, { status: 409 });
    }

    const { data: bet, error } = await supabase
      .from("bets")
      .upsert(
        {
          group_id: groupId,
          participant_id: participantId,
          match_id: matchId,
          home_score_prediction: homeScorePrediction,
          away_score_prediction: awayScorePrediction,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_id,participant_id,match_id" },
      )
      .select("id,match_id,home_score_prediction,away_score_prediction,status,points,updated_at")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    await dispatchN8nEvent("bet_registered", {
      groupName: group.name,
      userName: participant?.name,
      phone: participant?.whatsapp,
      match: `${match.home_team} x ${match.away_team}`,
      prediction: `${homeScorePrediction} x ${awayScorePrediction}`,
    }).catch(() => undefined);

    return Response.json({ bet });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar palpite.";
    return Response.json({ error: message }, { status: 500 });
  }
}
