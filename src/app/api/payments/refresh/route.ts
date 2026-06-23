import { z } from "zod";
import { refreshPaymentStatus } from "@/lib/payments";

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

    const payment = await refreshPaymentStatus(parsed.data.paymentId);

    return Response.json({ payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao verificar pagamento.";

    return Response.json({ error: message }, { status: 500 });
  }
}
