import { z } from "zod";
import { getSessionTokenFromRequest, requireParticipantSession } from "@/lib/auth";
import { refreshPaymentStatus } from "@/lib/payments";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const refreshPaymentSchema = z.object({
  paymentId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = refreshPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: existingPayment, error: paymentLookupError } = await supabase
      .from("payments")
      .select("participant_id")
      .eq("id", parsed.data.paymentId)
      .single();

    if (paymentLookupError || !existingPayment) {
      return Response.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }

    await requireParticipantSession(existingPayment.participant_id, getSessionTokenFromRequest(request));

    const payment = await refreshPaymentStatus(parsed.data.paymentId);

    return Response.json({ payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao verificar pagamento.";

    return Response.json({ error: message }, { status: 500 });
  }
}
