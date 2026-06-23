import { env } from "@/lib/env";

type MercadoPagoPixPayment = {
  id: number;
  status: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
  date_of_expiration?: string;
};

export const createPixPayment = async (input: {
  amountCents: number;
  description: string;
  participantName: string;
  participantWhatsapp: string;
  externalReference: string;
}) => {
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.externalReference,
    },
    body: JSON.stringify({
      transaction_amount: input.amountCents / 100,
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.externalReference,
      notification_url: `${env.appBaseUrl}/api/webhooks/mercadopago`,
      payer: {
        first_name: input.participantName,
        email: `${input.participantWhatsapp}@bolao.local`,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago PIX creation failed: ${response.status} ${body}`);
  }

  return (await response.json()) as MercadoPagoPixPayment;
};

export const getPayment = async (paymentId: string) => {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago payment lookup failed: ${response.status}`);
  }

  return (await response.json()) as MercadoPagoPixPayment;
};

export const mapMercadoPagoStatus = (status: string) => {
  if (status === "approved") return "approved";
  if (["rejected", "cancelled"].includes(status)) return "rejected";
  if (status === "refunded") return "refunded";
  if (status === "expired") return "expired";
  return "pending";
};
