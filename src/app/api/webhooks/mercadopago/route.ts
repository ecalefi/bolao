import { getPayment, mapMercadoPagoStatus } from "@/lib/mercadopago";
import { refreshPaymentStatus } from "@/lib/payments";
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
    await refreshPaymentStatus(payment.id);
  }

  return Response.json({ ok: true });
}
