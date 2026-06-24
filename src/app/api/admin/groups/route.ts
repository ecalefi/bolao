import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { dispatchN8nEvent } from "@/lib/n8n";
import { getPredefinedMatchByFixtureId } from "@/lib/predefined-matches";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { createGroupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const predefinedMatch = getPredefinedMatchByFixtureId(parsed.data.apiFootballFixtureId);

  if (!predefinedMatch) {
    return Response.json({ error: "Jogo selecionado não encontrado." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("betting_groups")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      admin_whatsapp: parsed.data.adminWhatsapp,
      pix_amount_cents: parsed.data.pixAmountCents,
    })
    .select("id,name,slug,invite_token,pix_amount_cents,bet_lock_minutes_before_match")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .upsert(
      {
        api_football_fixture_id: predefinedMatch.fixtureId,
        home_team_id: predefinedMatch.homeTeam.id,
        away_team_id: predefinedMatch.awayTeam.id,
        home_team: predefinedMatch.homeTeam.name,
        away_team: predefinedMatch.awayTeam.name,
        starts_at: predefinedMatch.startsAt,
        status: predefinedMatch.status,
        home_score: 0,
        away_score: 0,
        last_synced_at: new Date().toISOString(),
        raw_payload: { source: "predefined", ...predefinedMatch },
      },
      { onConflict: "api_football_fixture_id" },
    )
    .select("id,home_team,away_team")
    .single();

  if (matchError || !match) {
    return Response.json({ error: matchError?.message ?? "Erro ao vincular jogo." }, { status: 500 });
  }

  const { error: linkError } = await supabase.from("group_matches").upsert(
    {
      group_id: data.id,
      match_id: match.id,
    },
    { onConflict: "group_id,match_id" },
  );

  if (linkError) {
    return Response.json({ error: linkError.message }, { status: 500 });
  }

  await dispatchN8nEvent("group_created", {
    groupId: data.id,
    groupName: data.name,
    slug: data.slug,
    inviteToken: data.invite_token,
    phone: parsed.data.adminWhatsapp,
    link: `${env.appBaseUrl}/bolao/${data.slug}?invite=${data.invite_token}`,
  }).catch(() => undefined);

  return Response.json({ group: data, match });
}
