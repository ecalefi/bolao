type SupabaseAdminClient = ReturnType<typeof import("@/lib/supabase/server").createSupabaseAdmin>;

type PrizeDecision = "rollover" | "refund";

type GroupRow = {
  id: string;
  name: string;
  slug: string;
  pix_amount_cents: number;
  prize_status?: string;
  no_winner_decision?: PrizeDecision | null;
  rollover_amount_cents?: number;
  prize_decided_at?: string | null;
  prize_decision_note?: string | null;
};

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  status: string;
  home_score: number;
  away_score: number;
};

type BetRow = {
  id: string;
  participant_id: string;
  match_id: string;
  home_score_prediction: number;
  away_score_prediction: number;
  participants: { name: string; whatsapp: string } | { name: string; whatsapp: string }[] | null;
};

const finalStatuses = new Set(["ft", "aet", "pen", "finished", "final", "closed", "scored"]);

const firstOrNull = <T>(value: T | T[] | null | undefined) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

export const buildPrizeSummary = async (supabase: SupabaseAdminClient, groupId: string) => {
  const [{ data: group }, { data: groupMatches }, { data: bets }, { data: payments }] = await Promise.all([
    supabase
      .from("betting_groups")
      .select(
        "id,name,slug,pix_amount_cents,prize_status,no_winner_decision,rollover_amount_cents,prize_decided_at,prize_decision_note",
      )
      .eq("id", groupId)
      .single(),
    supabase
      .from("group_matches")
      .select("matches(id,home_team,away_team,status,home_score,away_score)")
      .eq("group_id", groupId),
    supabase
      .from("bets")
      .select("id,participant_id,match_id,home_score_prediction,away_score_prediction,participants(name,whatsapp)")
      .eq("group_id", groupId),
    supabase.from("payments").select("participant_id,amount_cents,status").eq("group_id", groupId).eq("status", "approved"),
  ]);

  const typedGroup = group as GroupRow | null;
  const matches = ((groupMatches ?? []) as unknown as Array<{ matches: MatchRow | MatchRow[] | null }>).flatMap(
    (row) => {
      if (!row.matches) return [];
      return Array.isArray(row.matches) ? row.matches : [row.matches];
    },
  );
  const typedBets = (bets ?? []) as unknown as BetRow[];
  const approvedPayments = (payments ?? []) as Array<{ participant_id: string; amount_cents: number; status: string }>;
  const paidParticipantIds = new Set(approvedPayments.map((payment) => payment.participant_id));
  const totalAmountCents = approvedPayments.reduce((sum, payment) => sum + (payment.amount_cents ?? 0), 0);
  const finishedMatchIds = new Set(
    matches.filter((match) => finalStatuses.has(String(match.status).toLowerCase())).map((match) => match.id),
  );
  const eligibleBets = typedBets.filter((bet) => paidParticipantIds.has(bet.participant_id) && finishedMatchIds.has(bet.match_id));
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const winners = eligibleBets.filter((bet) => {
    const match = matchesById.get(bet.match_id);
    if (!match) return false;

    return bet.home_score_prediction === match.home_score && bet.away_score_prediction === match.away_score;
  });
  const winnerParticipantIds = new Set(winners.map((winner) => winner.participant_id));
  const uniqueWinners = Array.from(winnerParticipantIds).map((participantId) => {
    const winner = winners.find((bet) => bet.participant_id === participantId);
    const participant = firstOrNull(winner?.participants);

    return {
      participantId,
      name: participant?.name ?? "Participante",
      whatsapp: participant?.whatsapp,
    };
  });
  const hasFinishedMatch = finishedMatchIds.size > 0;
  const hasNoWinner = hasFinishedMatch && uniqueWinners.length === 0 && totalAmountCents > 0;

  return {
    group: typedGroup,
    totalAmountCents,
    paidParticipantsCount: paidParticipantIds.size,
    hasFinishedMatch,
    hasNoWinner,
    winners: uniqueWinners,
    winnerCount: uniqueWinners.length,
    prizePerWinnerCents: uniqueWinners.length > 0 ? Math.floor(totalAmountCents / uniqueWinners.length) : 0,
    currentDecision: typedGroup?.no_winner_decision ?? null,
    prizeStatus: typedGroup?.prize_status ?? "pending",
    rolloverAmountCents: typedGroup?.rollover_amount_cents ?? 0,
    prizeDecidedAt: typedGroup?.prize_decided_at ?? null,
    canDecideNoWinner: hasNoWinner && !typedGroup?.no_winner_decision,
  };
};

export const applyNoWinnerDecision = async (
  supabase: SupabaseAdminClient,
  groupId: string,
  decision: PrizeDecision,
  note?: string,
) => {
  const summary = await buildPrizeSummary(supabase, groupId);

  if (!summary.hasNoWinner) {
    throw new Error("Este grupo ainda não está em cenário sem vencedor.");
  }

  if (summary.currentDecision) {
    throw new Error("A decisão deste grupo já foi registrada.");
  }

  const prizeStatus = decision === "rollover" ? "rolled_over" : "refunded";
  const rolloverAmountCents = decision === "rollover" ? summary.totalAmountCents : 0;

  const { data: group, error } = await supabase
    .from("betting_groups")
    .update({
      prize_status: prizeStatus,
      no_winner_decision: decision,
      rollover_amount_cents: rolloverAmountCents,
      prize_decided_at: new Date().toISOString(),
      prize_decision_note: note ?? null,
    })
    .eq("id", groupId)
    .select(
      "id,name,slug,pix_amount_cents,prize_status,no_winner_decision,rollover_amount_cents,prize_decided_at,prize_decision_note",
    )
    .single();

  if (error || !group) {
    throw new Error(error?.message ?? "Não foi possível registrar a decisão.");
  }

  return { ...summary, group: group as GroupRow, prizeStatus, currentDecision: decision, rolloverAmountCents };
};
