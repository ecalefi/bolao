const requireEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

export const env = {
  get supabaseUrl() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get mercadoPagoAccessToken() {
    return requireEnv("MERCADOPAGO_ACCESS_TOKEN");
  },
  get mercadoPagoWebhookSecret() {
    return process.env.MERCADOPAGO_WEBHOOK_SECRET;
  },
  get apiFootballKey() {
    return requireEnv("API_FOOTBALL_KEY");
  },
  get apiFootballBrazilTeamId() {
    return Number(process.env.API_FOOTBALL_BRAZIL_TEAM_ID ?? "6");
  },
  get n8nWebhookBaseUrl() {
    return process.env.N8N_WEBHOOK_BASE_URL;
  },
  get n8nWebhookSecret() {
    return process.env.N8N_WEBHOOK_SECRET;
  },
  get appBaseUrl() {
    return process.env.APP_BASE_URL ?? "http://localhost:3000";
  },
  get cronSecret() {
    return requireEnv("CRON_SECRET");
  },
};
