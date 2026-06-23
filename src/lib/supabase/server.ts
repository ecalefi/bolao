import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const createSupabaseAdmin = () =>
  createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
