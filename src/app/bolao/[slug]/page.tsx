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
    <main className="relative flex-1 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_460px] lg:items-start">
        <section>
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent" />
            Convite privado
          </p>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {group?.name ?? "Bolão Copa do Mundo"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Entre no grupo, confirme seu WhatsApp, pague via PIX e registre seu palpite antes da bola rolar.
          </p>

          {match ? (
            <div className="mt-6 rounded-xl border border-line bg-surface p-5">
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-accent">Jogo do bolão</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">
                {match.home_team} <span className="text-muted">×</span> {match.away_team}
              </h2>
              <p className="mt-1.5 text-sm text-muted">{formatDateTime(match.starts_at)}</p>
            </div>
          ) : null}

          {group ? (
            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/8 px-5 py-3">
              <span className="font-display text-2xl font-extrabold text-gold-text">{formatCurrency(group.pix_amount_cents)}</span>
              <span className="text-sm text-muted">por participante via PIX</span>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="font-display text-sm font-bold text-accent">1.</p>
              <p className="text-sm text-fg">Identifique-se</p>
              <p className="mt-0.5 text-xs text-muted">Nome e WhatsApp</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="font-display text-sm font-bold text-accent">2.</p>
              <p className="text-sm text-fg">Pague o PIX</p>
              <p className="mt-0.5 text-xs text-muted">Valor do bolão</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="font-display text-sm font-bold text-accent">3.</p>
              <p className="text-sm text-fg">Dê seu palpite</p>
              <p className="mt-0.5 text-xs text-muted">Antes da bola rolar</p>
            </div>
          </div>
        </section>

        {invite ? (
          <JoinGroupForm inviteToken={invite} />
        ) : (
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="font-display text-2xl font-extrabold">Convite inválido</h2>
            <p className="mt-2 text-muted">Peça ao administrador o link privado completo do bolão.</p>
          </section>
        )}
      </div>
    </main>
  );
}
