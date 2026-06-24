import { JoinGroupForm } from "@/components/join-group-form";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { slug } = await params;
  const { invite } = await searchParams;
  const supabase = createSupabaseAdmin();

  const { data: group } = await supabase
    .from("betting_groups")
    .select("name,pix_amount_cents,bet_lock_minutes_before_match")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  let match: { home_team: string; away_team: string; starts_at: string } | null = null;

  if (group) {
    const { data: groupMatch } = await supabase
      .from("group_matches")
      .select("matches(home_team,away_team,starts_at)")
      .eq("group_id", (await supabase.from("betting_groups").select("id").eq("slug", slug).single()).data?.id)
      .limit(1);

    if (groupMatch && groupMatch.length > 0) {
      const raw = groupMatch[0].matches;
      if (raw && !Array.isArray(raw)) {
        match = raw as { home_team: string; away_team: string; starts_at: string };
      }
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#071b12] px-6 py-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section>
          <p className="inline-flex rounded-full bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-950">
            Convite privado
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            {group?.name ?? "Bolão Copa do Mundo"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-emerald-50/80">
            Entre no grupo, confirme seu WhatsApp, pague via PIX e registre seu palpite antes da bola rolar.
          </p>

          {match ? (
            <div className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-900 p-5 ring-1 ring-white/10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Jogo do bolão</p>
              <h2 className="mt-3 text-3xl font-black">{match.home_team} x {match.away_team}</h2>
              <p className="mt-2 text-sm text-emerald-100">{formatDateTime(match.starts_at)}</p>
            </div>
          ) : null}

          {group ? (
            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-yellow-300/10 px-5 py-3 ring-1 ring-yellow-300/20">
              <span className="text-2xl font-black text-yellow-200">{formatCurrency(group.pix_amount_cents)}</span>
              <span className="text-sm text-yellow-100/80">por participante via PIX</span>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 text-sm text-emerald-50/80 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><strong className="text-yellow-200">1.</strong> Identifique-se</div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><strong className="text-yellow-200">2.</strong> Pague o PIX</div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><strong className="text-yellow-200">3.</strong> Dê seu palpite</div>
          </div>
        </section>

        {invite ? (
          <JoinGroupForm inviteToken={invite} />
        ) : (
          <section className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl shadow-black/20 ring-1 ring-white/20">
            <h2 className="text-2xl font-bold">Convite inválido</h2>
            <p className="mt-2 text-slate-600">Peça ao administrador o link privado completo do bolão.</p>
          </section>
        )}
      </div>
    </main>
  );
}