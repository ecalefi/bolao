import { randomUUID } from "crypto";
import { createPixPayment } from "@/lib/mercadopago";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { createPaymentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { groupId, participantId } = parsed.data;

  const { data: member } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", groupId)
    .eq("participant_id", participantId)
    .single();

  if (member?.status === "paid") {
    return Response.json({ error: "Participante já está pago." }, { status: 409 });
  }

  const { data: group, error: groupError } = await supabase
    .from("betting_groups")
    .select("id,name,pix_amount_cents")
    .eq("id", groupId)
    .single();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id,name,whatsapp")
    .eq("id", participantId)
    .single();

  if (groupError || participantError || !group || !participant) {
    return Response.json({ error: "Grupo ou participante inválido." }, { status: 404 });
  }

  const externalReference = randomUUID();
  const pix = await createPixPayment({
    amountCents: group.pix_amount_cents,
    description: `Bolão ${group.name}`,
    participantName: participant.name,
    participantWhatsapp: participant.whatsapp,
    externalReference,
  });

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      group_id: group.id,
      participant_id: participant.id,
      provider_payment_id: String(pix.id),
      amount_cents: group.pix_amount_cents,
      status: "pending",
      pix_qr_code: pix.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_code_base64: pix.point_of_interaction?.transaction_data?.qr_code_base64,
      expires_at: pix.date_of_expiration,
    })
    .select("id,status,pix_qr_code,pix_qr_code_base64,expires_at,amount_cents")
    .single();

  if (paymentError) {
    return Response.json({ error: paymentError.message }, { status: 500 });
  }

  return Response.json({ payment });
}
