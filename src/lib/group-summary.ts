import { formatMatchTitle } from "@/lib/format";

type SupabaseAdminClient = ReturnType<typeof import("@/lib/supabase/server").createSupabaseAdmin>;

type MatchRow = {
  id: string;
  home_team: string;
  away_team: string;
  starts_at: string;
};

type MemberRow = {
  participant_id: string;
  status: string;
  participants: { name: string; whatsapp: string } | { name: string; whatsapp: string }[] | null;
};

type BetRow = {
  participant_id: string;
  match_id: string;
  home_score_prediction: number;
  away_score_prediction: number;
  status: string;
  points: number | null;
};

const firstOrNull = <T>(value: T | T[] | null | undefined) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

export const buildGroupParticipantBetsSummary = async (supabase: SupabaseAdminClient, groupId: string) => {
  const [{ data: group }, { data: groupMatches }, { data: members }, { data: bets }] = await Promise.all([
    supabase.from("betting_groups").select("id,name,slug").eq("id", groupId).single(),
    supabase
      .from("group_matches")
      .select("matches(id,home_team,away_team,starts_at)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true }),
    supabase
      .from("group_members")
      .select("participant_id,status,participants(name,whatsapp)")
      .eq("group_id", groupId)
      .eq("status", "paid")
      .order("joined_at", { ascending: true }),
    supabase
      .from("bets")
      .select("participant_id,match_id,home_score_prediction,away_score_prediction,status,points")
      .eq("group_id", groupId),
  ]);

  const matches = ((groupMatches ?? []) as unknown as Array<{ matches: MatchRow | MatchRow[] | null }>).flatMap(
    (row) => {
      if (!row.matches) return [];
      return Array.isArray(row.matches) ? row.matches : [row.matches];
    },
  );
  const typedMembers = (members ?? []) as unknown as MemberRow[];
  const typedBets = (bets ?? []) as unknown as BetRow[];

  const betsByParticipant = new Map<string, BetRow[]>();
  for (const bet of typedBets) {
    betsByParticipant.set(bet.participant_id, [...(betsByParticipant.get(bet.participant_id) ?? []), bet]);
  }

  const matchById = new Map(matches.map((match) => [match.id, match]));
  const participants = typedMembers.map((member) => {
    const participant = firstOrNull(member.participants);
    const participantBets = betsByParticipant.get(member.participant_id) ?? [];

    return {
      participantId: member.participant_id,
      name: participant?.name ?? "Participante",
      whatsapp: participant?.whatsapp,
      bets: participantBets.map((bet) => {
        const match = matchById.get(bet.match_id);

        return {
          matchId: bet.match_id,
          match: match ? formatMatchTitle(match.home_team, match.away_team) : "Jogo",
          prediction: `${bet.home_score_prediction} x ${bet.away_score_prediction}`,
          status: bet.status,
          points: bet.points,
        };
      }),
    };
  });

  const summaryLines = participants.map((participant, index) => {
    const betText = participant.bets.length
      ? participant.bets.map((bet) => `${bet.match}: ${bet.prediction}`).join(" | ")
      : "sem palpite ainda";

    return `${index + 1}. ${participant.name} — ${betText}`;
  });

  return {
    group,
    matches: matches.map((match) => ({
      id: match.id,
      match: formatMatchTitle(match.home_team, match.away_team),
      startsAt: match.starts_at,
    })),
    participants,
    participantCount: participants.length,
    summaryText: summaryLines.length
      ? `Lista atual do bolão ${group?.name ?? ""}:\n${summaryLines.join("\n")}`
      : `Lista atual do bolão ${group?.name ?? ""}: nenhum participante confirmado ainda.`,
  };
};
