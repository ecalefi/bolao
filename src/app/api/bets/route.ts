import { dispatchN8nEvent } from "@/lib/n8n";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { upsertBetSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = upsertBetSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { groupId, participantId, matchId, homeScorePrediction, awayScorePrediction } = parsed.data;

  const { data: member } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("participant_id", participantId)
    .single();

  if (member?.status !== "paid") {
    return Response.json({ error: "Pagamento pendente. Palpite bloqueado." }, { status: 403 });
  }

  const { data: context } = await supabase
    .from("group_matches")
    .select("betting_groups(name,bet_lock_minutes_before_match),matches(id,home_team,away_team,starts_at),participants(name,whatsapp)")
    .eq("group_id", groupId)
    .eq("match_id", matchId)
    .single();

  const typedContext = context as unknown as {
    betting_groups: { name: string; bet_lock_minutes_before_match: number } | null;
    matches: { id: string; home_team: string; away_team: string; starts_at: string } | null;
    participants: { name: string; whatsapp: string } | null;
  };

  if (!typedContext.matches || !typedContext.betting_groups) {
    return Response.json({ error: "Jogo não pertence a este grupo." }, { status: 404 });
  }

  const lockMinutes = typedContext.betting_groups.bet_lock_minutes_before_match ?? 5;
  const lockTime = new Date(new Date(typedContext.matches.starts_at).getTime() - lockMinutes * 60_000);

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
    .select("id,home_score_prediction,away_score_prediction,updated_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await dispatchN8nEvent("bet_registered", {
    groupName: typedContext.betting_groups.name,
    userName: typedContext.participants?.name,
    phone: typedContext.participants?.whatsapp,
    match: `${typedContext.matches.home_team} x ${typedContext.matches.away_team}`,
    prediction: `${homeScorePrediction} x ${awayScorePrediction}`,
  }).catch(() => undefined);

  return Response.json({ bet });
}
