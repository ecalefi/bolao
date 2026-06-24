import { dispatchN8nEvent } from "@/lib/n8n";
import { generateOtpCode, hashSecret } from "@/lib/auth";
import { normalizeBrazilWhatsapp } from "@/lib/format";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const groupSlug = String(body.groupSlug ?? "").trim();
    const whatsapp = normalizeBrazilWhatsapp(String(body.whatsapp ?? ""));

    if (!groupSlug || !/^55[0-9]{10,11}$/.test(whatsapp)) {
      return Response.json({ error: "Informe slug do grupo e WhatsApp admin válidos." }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: group, error: groupError } = await supabase
      .from("betting_groups")
      .select("id,name,slug,admin_whatsapp")
      .eq("slug", groupSlug)
      .single();

    const groupAdminWhatsapp = group ? normalizeBrazilWhatsapp(group.admin_whatsapp) : null;

    if (groupError || !groupAdminWhatsapp || groupAdminWhatsapp !== whatsapp) {
      return Response.json({ error: "Grupo não encontrado ou WhatsApp admin inválido." }, { status: 403 });
    }

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .upsert({ name: `Admin ${group.name}`, whatsapp }, { onConflict: "whatsapp" })
      .select("id,name,whatsapp")
      .single();

    if (participantError || !participant) {
      return Response.json({ error: participantError?.message ?? "Erro ao preparar admin." }, { status: 500 });
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

    return Response.json({ group, participant, otpSent: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enviar código admin.";
    return Response.json({ error: message }, { status: 500 });
  }
}
