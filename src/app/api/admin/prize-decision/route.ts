import { NextRequest } from "next/server";
import { z } from "zod";
import { requireParticipantSession } from "@/lib/auth";
import { formatCurrencyFromCents, normalizeBrazilWhatsapp } from "@/lib/format";
import { dispatchN8nEvent } from "@/lib/n8n";
import { applyNoWinnerDecision } from "@/lib/prize";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  groupId: z.string().uuid(),
  adminParticipantId: z.string().uuid(),
  decision: z.enum(["rollover", "refund"]),
  note: z.string().trim().max(280).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { groupId, adminParticipantId, decision, note } = parsed.data;
    const sessionToken = request.headers.get("x-participant-session");

    await requireParticipantSession(adminParticipantId, sessionToken);

    const supabase = createSupabaseAdmin();
    const [{ data: participant }, { data: group }] = await Promise.all([
      supabase.from("participants").select("whatsapp,name").eq("id", adminParticipantId).single(),
      supabase.from("betting_groups").select("id,name,admin_whatsapp").eq("id", groupId).single(),
    ]);

    if (!participant || !group) {
      return Response.json({ error: "Sem permissão para decidir este grupo." }, { status: 403 });
    }

    const participantWhatsapp = normalizeBrazilWhatsapp(participant.whatsapp);
    const groupAdminWhatsapp = normalizeBrazilWhatsapp(group.admin_whatsapp);

    const { data: adminMember } = await supabase
      .from("group_members")
      .select("id,role")
      .eq("group_id", groupId)
      .eq("participant_id", adminParticipantId)
      .eq("role", "admin")
      .maybeSingle();

    const isGroupAdminByPhone = participantWhatsapp === groupAdminWhatsapp;
    const isGroupAdminByMemberRole = Boolean(adminMember);

    if (!isGroupAdminByPhone && !isGroupAdminByMemberRole) {
      return Response.json({ error: "Sem permissão para decidir este grupo." }, { status: 403 });
    }

    const prize = await applyNoWinnerDecision(supabase, groupId, decision, note);
    const decisionLabel = decision === "rollover" ? "acumular para o próximo jogo" : "reembolsar todos os participantes";

    await dispatchN8nEvent("no_winner_decision", {
      groupId,
      groupName: group.name,
      phone: group.admin_whatsapp,
      adminName: participant.name,
      decision,
      decisionLabel,
      amountCents: prize.totalAmountCents,
      amountFormatted: formatCurrencyFromCents(prize.totalAmountCents),
      note,
    }).catch(() => undefined);

    return Response.json({ prize });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao registrar decisão.";
    return Response.json({ error: message }, { status: 500 });
  }
}
