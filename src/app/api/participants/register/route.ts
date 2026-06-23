import { createSupabaseAdmin } from "@/lib/supabase/server";
import { registerParticipantSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerParticipantSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { name, whatsapp, inviteToken } = parsed.data;

  const { data: group, error: groupError } = await supabase
    .from("betting_groups")
    .select("id,name,slug,pix_amount_cents")
    .eq("invite_token", inviteToken)
    .eq("status", "active")
    .single();

  if (groupError || !group) {
    return Response.json({ error: "Grupo não encontrado ou inativo." }, { status: 404 });
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .upsert({ name, whatsapp }, { onConflict: "whatsapp" })
    .select("id,name,whatsapp")
    .single();

  if (participantError || !participant) {
    return Response.json({ error: participantError?.message ?? "Erro ao cadastrar participante." }, { status: 500 });
  }

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("group_members")
    .select("id,status")
    .eq("group_id", group.id)
    .eq("participant_id", participant.id)
    .maybeSingle();

  if (existingMemberError) {
    return Response.json({ error: existingMemberError.message }, { status: 500 });
  }

  if (existingMember) {
    return Response.json({ group, participant, member: existingMember });
  }

  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      participant_id: participant.id,
      status: "pending_payment",
    })
    .select("id,status")
    .single();

  if (memberError) {
    return Response.json({ error: memberError.message }, { status: 500 });
  }

  return Response.json({ group, participant, member });
}
