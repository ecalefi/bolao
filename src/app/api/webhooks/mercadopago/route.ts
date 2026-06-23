import { dispatchN8nEvent } from "@/lib/n8n";
import { getPayment, mapMercadoPagoStatus } from "@/lib/mercadopago";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const paymentId = body?.data?.id ?? body?.id ?? new URL(request.url).searchParams.get("id");

  if (!paymentId) {
    return Response.json({ ok: true, ignored: true });
  }

  const mercadoPagoPayment = await getPayment(String(paymentId));
  const status = mapMercadoPagoStatus(mercadoPagoPayment.status);
  const supabase = createSupabaseAdmin();

  const { data: payment, error } = await supabase
    .from("payments")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("provider_payment_id", String(paymentId))
    .select("id,group_id,participant_id,amount_cents,status")
    .single();

  if (error || !payment) {
    return Response.json({ error: error?.message ?? "Pagamento não encontrado." }, { status: 404 });
  }

  if (status === "approved") {
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
    }).catch(async (dispatchError) => {
      await supabase.from("notifications").insert({
        group_id: payment.group_id,
        participant_id: payment.participant_id,
        type: "payment_confirmed",
        status: "failed",
        payload: { paymentId },
        error: dispatchError instanceof Error ? dispatchError.message : "unknown",
      });
    });
  }

  return Response.json({ ok: true });
}
