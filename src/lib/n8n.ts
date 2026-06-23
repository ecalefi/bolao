import { env } from "@/lib/env";

type N8nEvent =
  | "payment_confirmed"
  | "bet_registered"
  | "goal_detected"
  | "match_finished";

export const dispatchN8nEvent = async (event: N8nEvent, payload: Record<string, unknown>) => {
  if (!env.n8nWebhookBaseUrl) {
    return { skipped: true };
  }

  const response = await fetch(`${env.n8nWebhookBaseUrl}/${event}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.n8nWebhookSecret ? { "x-bolao-secret": env.n8nWebhookSecret } : {}),
    },
    body: JSON.stringify({ event, ...payload }),
  });

  if (!response.ok) {
    throw new Error(`n8n webhook failed for ${event}: ${response.status}`);
  }

  return { skipped: false };
};
