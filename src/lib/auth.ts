import { createHash, randomBytes, randomInt } from "crypto";
import { env } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const hashSecret = (value: string) =>
  createHash("sha256").update(`${value}:${env.otpSecret}`).digest("hex");

export const generateOtpCode = () => String(randomInt(100000, 999999));

export const generateSessionToken = () => randomBytes(32).toString("hex");

export const createParticipantSession = async (participantId: string) => {
  const token = generateSessionToken();
  const tokenHash = hashSecret(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("participant_sessions").insert({
    participant_id: participantId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { token, expiresAt };
};

export const requireParticipantSession = async (participantId: string, token?: string | null) => {
  if (!token) {
    throw new Error("Sessão inválida. Confirme seu WhatsApp novamente.");
  }

  const tokenHash = hashSecret(token);
  const supabase = createSupabaseAdmin();
  const { data: session, error } = await supabase
    .from("participant_sessions")
    .select("id,participant_id,expires_at,revoked_at")
    .eq("participant_id", participantId)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!session || session.revoked_at || new Date(session.expires_at) <= new Date()) {
    throw new Error("Sessão expirada. Confirme seu WhatsApp novamente.");
  }

  return session;
};

export const getSessionTokenFromRequest = (request: Request) =>
  request.headers.get("x-participant-session");
