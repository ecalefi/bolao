import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { createGroupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
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

  return Response.json({ group: data });
}
