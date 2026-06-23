import { getPayment, mapMercadoPagoStatus } from "@/lib/mercadopago";
import { dispatchN8nEvent } from "@/lib/n8n";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const refreshPaymentStatus = async (paymentId: string) => {
  const supabase = createSupabaseAdmin();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id,group_id,participant_id,provider_payment_id,amount_cents,status")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment?.provider_payment_id) {
    throw new Error(paymentError?.message ?? "Pagamento não encontrado.");
  }

  const mercadoPagoPayment = await getPayment(payment.provider_payment_id);
  const status = mapMercadoPagoStatus(mercadoPagoPayment.status);

  const { data: updatedPayment, error: updateError } = await supabase
    .from("payments")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", payment.id)
    .select("id,group_id,participant_id,amount_cents,status")
    .single();

  if (updateError || !updatedPayment) {
    throw new Error(updateError?.message ?? "Erro ao atualizar pagamento.");
  }

  if (status !== "approved") {
    return updatedPayment;
  }

  await supabase
    .from("group_members")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("group_id", payment.group_id)
    .eq("participant_id", payment.participant_id);

  const { data: context } = await supabase
    .from("group_members")
    .select("betting_groups(name),participants(name,whatsapp)")
    .eq("group_id", payment.group_id)
    .eq("participant_id", payment.participant_id)
    .single();

  const typedContext = context as unknown as {
    betting_groups: { name: string } | null;
    participants: { name: string; whatsapp: string } | null;
  } | null;

  await dispatchN8nEvent("payment_confirmed", {
    groupId: payment.group_id,
    participantId: payment.participant_id,
    amountCents: payment.amount_cents,
    groupName: typedContext?.betting_groups?.name,
    userName: typedContext?.participants?.name,
    phone: typedContext?.participants?.whatsapp,
  }).catch(() => undefined);

  return updatedPayment;
};
