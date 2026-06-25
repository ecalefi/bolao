import { NextRequest } from "next/server";
import { requireParticipantSession } from "@/lib/auth";
import { normalizeBrazilWhatsapp } from "@/lib/format";
import { buildPrizeSummary } from "@/lib/prize";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId");
    const adminParticipantId = request.nextUrl.searchParams.get("adminParticipantId");
    const sessionToken = request.headers.get("x-participant-session");

    if (!groupId || !adminParticipantId) {
      return Response.json({ error: "groupId e adminParticipantId são obrigatórios." }, { status: 400 });
    }

    await requireParticipantSession(adminParticipantId, sessionToken);

    const supabase = createSupabaseAdmin();
    const { data: participant } = await supabase
      .from("participants")
      .select("whatsapp")
      .eq("id", adminParticipantId)
      .single();
    const { data: group } = await supabase
      .from("betting_groups")
      .select("id,name,slug,admin_whatsapp,prize_status,no_winner_decision,rollover_amount_cents,prize_decided_at")
      .eq("id", groupId)
      .single();

    const participantWhatsapp = participant ? normalizeBrazilWhatsapp(participant.whatsapp) : null;
    const groupAdminWhatsapp = group ? normalizeBrazilWhatsapp(group.admin_whatsapp) : null;

    const { data: adminMember } = await supabase
      .from("group_members")
      .select("id,role")
      .eq("group_id", groupId)
      .eq("participant_id", adminParticipantId)
      .eq("role", "admin")
      .maybeSingle();

    const isGroupAdminByPhone = Boolean(participantWhatsapp && groupAdminWhatsapp && participantWhatsapp === groupAdminWhatsapp);
    const isGroupAdminByMemberRole = Boolean(adminMember);

    if (!isGroupAdminByPhone && !isGroupAdminByMemberRole) {
      return Response.json({ error: "Sem permissão para visualizar este grupo." }, { status: 403 });
    }

    const { data: bets, error } = await supabase
      .from("bets")
      .select("id,home_score_prediction,away_score_prediction,status,points,updated_at,participants(name,whatsapp),matches(home_team,away_team,starts_at)")
      .eq("group_id", groupId)
      .order("updated_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const prize = await buildPrizeSummary(supabase, groupId);

    return Response.json({ group, bets: bets ?? [], prize });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar palpites.";
    return Response.json({ error: message }, { status: 500 });
  }
}
