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
    .select("id,name,pix_amount_cents,bet_lock_minutes_before_match")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  let match: { home_team: string; away_team: string; starts_at: string } | null = null;

  if (group) {
    const { data: groupMatch } = await supabase
      .from("group_matches")
      .select("matches(home_team,away_team,starts_at)")
      .eq("group_id", group.id)
      .limit(1);

    if (groupMatch && groupMatch.length > 0) {
      const raw = groupMatch[0].matches;
      if (raw && !Array.isArray(raw)) {
        match = raw as { home_team: string; away_team: string; starts_at: string };
      }
    }
  }

  return (
    <main className="scanlines relative min-h-screen overflow-hidden bg-[#0F0F23] px-6 py-8 text-slate-100">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section>
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            Convite privado
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight sm:text-6xl">
            {group?.name ?? "Bolão Copa do Mundo"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
            Entre no grupo, confirme seu WhatsApp, pague via PIX e registre seu palpite antes da bola rolar.
          </p>

          {match ? (
            <div className="mt-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-rose-500/10 p-5 neon-border">
              <p className="font-display text-xs uppercase tracking-[0.2em] text-violet-300">Jogo do bolão</p>
              <h2 className="mt-3 font-display text-3xl">{match.home_team} <span className="text-slate-500">×</span> {match.away_team}</h2>
              <p className="mt-2 text-sm text-slate-400">{formatDateTime(match.starts_at)}</p>
            </div>
          ) : null}

          {group ? (
            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-3">
              <span className="font-display text-2xl text-rose-400">{formatCurrency(group.pix_amount_cents)}</span>
              <span className="text-sm text-slate-400">por participante via PIX</span>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <strong className="font-display text-violet-400">1.</strong> Identifique-se
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <strong className="font-display text-violet-400">2.</strong> Pague o PIX
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
              <strong className="font-display text-violet-400">3.</strong> Dê seu palpite
            </div>
          </div>
        </section>

        {invite ? (
          <JoinGroupForm inviteToken={invite} />
        ) : (
          <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-slate-100 shadow-2xl shadow-violet-900/20">
            <h2 className="font-display text-2xl">Convite inválido</h2>
            <p className="mt-2 text-slate-400">Peça ao administrador o link privado completo do bolão.</p>
          </section>
        )}
      </div>
    </main>
  );
}