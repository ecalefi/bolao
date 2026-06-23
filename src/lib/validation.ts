import { z } from "zod";
import { normalizeBrazilWhatsapp } from "@/lib/format";

const whatsappSchema = z
  .string()
  .min(10)
  .transform(normalizeBrazilWhatsapp)
  .refine((value) => /^55[0-9]{10,11}$/.test(value), "WhatsApp inválido. Use DDD + número.");

export const registerParticipantSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  whatsapp: whatsappSchema,
  inviteToken: z.string().min(10),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(3),
  slug: z.string().trim().min(3).regex(/^[a-z0-9-]+$/),
  adminWhatsapp: whatsappSchema,
  pixAmountCents: z.coerce.number().int().positive(),
});

export const createPaymentSchema = z.object({
  groupId: z.string().uuid(),
  participantId: z.string().uuid(),
});

export const upsertBetSchema = z.object({
  groupId: z.string().uuid(),
  participantId: z.string().uuid(),
  matchId: z.string().uuid(),
  homeScorePrediction: z.coerce.number().int().min(0),
  awayScorePrediction: z.coerce.number().int().min(0),
});
