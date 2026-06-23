import { z } from "zod";
import { createParticipantSession, hashSecret } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  groupId: z.string().uuid(),
  participantId: z.string().uuid(),
  code: z.string().regex(/^[0-9]{6}$/),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const { groupId, participantId, code } = parsed.data;
    const supabase = createSupabaseAdmin();

    const { data: participant } = await supabase
      .from("participants")
      .select("id,name,whatsapp")
      .eq("id", participantId)
      .single();

    const { data: group } = await supabase
      .from("betting_groups")
      .select("id,name,slug,admin_whatsapp")
      .eq("id", groupId)
      .single();

    if (!participant || !group || participant.whatsapp !== group.admin_whatsapp) {
      return Response.json({ error: "Admin inválido para este grupo." }, { status: 403 });
    }

    const { data: otp } = await supabase
      .from("participant_otps")
      .select("id,code_hash,expires_at,attempts,consumed_at")
      .eq("participant_id", participantId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp || new Date(otp.expires_at) <= new Date() || otp.attempts >= 5) {
      return Response.json({ error: "Código inválido ou expirado." }, { status: 401 });
    }

    if (otp.code_hash !== hashSecret(code)) {
      await supabase.from("participant_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return Response.json({ error: "Código inválido." }, { status: 401 });
    }

    await supabase.from("participant_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);
    const session = await createParticipantSession(participantId);

    return Response.json({ group, participant, session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao verificar admin.";
    return Response.json({ error: message }, { status: 500 });
  }
}
