import { dispatchN8nEvent } from "@/lib/n8n";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { registerParticipantSchema } from "@/lib/validation";
import { generateOtpCode, hashSecret } from "@/lib/auth";

export async function POST(request: Request) {
  try {
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

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();

    const { error: otpError } = await supabase.from("participant_otps").insert({
      participant_id: participant.id,
      code_hash: hashSecret(code),
      expires_at: expiresAt,
    });

    if (otpError) {
      return Response.json({ error: otpError.message }, { status: 500 });
    }

    await dispatchN8nEvent("otp_requested", {
      groupId: group.id,
      groupName: group.name,
      participantId: participant.id,
      userName: participant.name,
      phone: participant.whatsapp,
      code,
      expiresInMinutes: 10,
    });

    return Response.json({
      group,
      participant,
      otpSent: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enviar código.";
    return Response.json({ error: message }, { status: 500 });
  }
}
