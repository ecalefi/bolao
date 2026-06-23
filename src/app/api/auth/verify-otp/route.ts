import { z } from "zod";
import { createParticipantSession, hashSecret } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const verifyOtpSchema = z.object({
  groupId: z.string().uuid(),
  participantId: z.string().uuid(),
  code: z.string().regex(/^[0-9]{6}$/),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { groupId, participantId, code } = parsed.data;
    const supabase = createSupabaseAdmin();

    const { data: otp, error: otpError } = await supabase
      .from("participant_otps")
      .select("id,code_hash,expires_at,attempts,consumed_at")
      .eq("participant_id", participantId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otp) {
      return Response.json({ error: "Código inválido ou expirado." }, { status: 401 });
    }

    if (new Date(otp.expires_at) <= new Date() || otp.attempts >= 5) {
      return Response.json({ error: "Código inválido ou expirado." }, { status: 401 });
    }

    if (otp.code_hash !== hashSecret(code)) {
      await supabase.from("participant_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return Response.json({ error: "Código inválido." }, { status: 401 });
    }

    await supabase.from("participant_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);

    const { data: existingMember, error: existingMemberError } = await supabase
      .from("group_members")
      .select("id,status")
      .eq("group_id", groupId)
      .eq("participant_id", participantId)
      .maybeSingle();

    if (existingMemberError) {
      return Response.json({ error: existingMemberError.message }, { status: 500 });
    }

    let member = existingMember;

    if (!member) {
      const { data: createdMember, error: memberError } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, participant_id: participantId, status: "pending_payment" })
        .select("id,status")
        .single();

      if (memberError || !createdMember) {
        return Response.json({ error: memberError?.message ?? "Erro ao entrar no grupo." }, { status: 500 });
      }

      member = createdMember;
    }

    const { data: group } = await supabase
      .from("betting_groups")
      .select("id,name,slug,pix_amount_cents")
      .eq("id", groupId)
      .single();

    const { data: participant } = await supabase
      .from("participants")
      .select("id,name,whatsapp")
      .eq("id", participantId)
      .single();

    const session = await createParticipantSession(participantId);

    return Response.json({ group, participant, member, session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao verificar código.";
    return Response.json({ error: message }, { status: 500 });
  }
}
