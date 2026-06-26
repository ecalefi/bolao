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
    <main className="app-shell relative flex-1 px-5 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_480px] lg:items-start">
        <section className="space-y-6">
          <div className="sport-card overflow-hidden rounded-[1.75rem]">
            <div className="bg-surface-strong p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white">
                  <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent" />
                  Convite privado
                </p>
                {group ? (
                  <span className="rounded-full bg-gold px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-fg">
                    {formatCurrency(group.pix_amount_cents)}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                {group?.name ?? "Bolão Copa do Mundo"}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/70">
                Confirme seu WhatsApp, pague via PIX e registre seu placar antes do fechamento da rodada.
              </p>
            </div>

            <div className="p-5 sm:p-6">
              {match ? (
                <div className="sport-panel rounded-3xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">Jogo do bolão</p>
                    <span className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs font-bold text-muted">
                      {formatDateTime(match.starts_at)}
                    </span>
                  </div>
                  <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
                    <div className="min-w-0 text-center">
                      <div className="team-crest mx-auto h-16 w-16">
                        <span className="font-display text-xl font-extrabold">{match.home_team.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <p className="mt-3 break-words font-display text-lg font-extrabold leading-tight text-fg">{match.home_team}</p>
                    </div>
                    <span className="mt-3 rounded-2xl border border-line bg-surface px-4 py-3 font-display text-2xl font-extrabold text-muted">
                      ×
                    </span>
                    <div className="min-w-0 text-center">
                      <div className="team-crest mx-auto h-16 w-16">
                        <span className="font-display text-xl font-extrabold">{match.away_team.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <p className="mt-3 break-words font-display text-lg font-extrabold leading-tight text-fg">{match.away_team}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="market-strip rounded-2xl p-4">
                  <p className="font-mono text-xs font-bold text-accent">01</p>
                  <p className="mt-2 font-display text-sm font-extrabold text-fg">Identifique-se</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Nome e WhatsApp para validar a entrada.</p>
                </div>
                <div className="market-strip rounded-2xl p-4">
                  <p className="font-mono text-xs font-bold text-accent">02</p>
                  <p className="mt-2 font-display text-sm font-extrabold text-fg">Pague o PIX</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Pagamento confirmado pelo Mercado Pago.</p>
                </div>
                <div className="market-strip rounded-2xl p-4">
                  <p className="font-mono text-xs font-bold text-accent">03</p>
                  <p className="mt-2 font-display text-sm font-extrabold text-fg">Envie o palpite</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Placar liberado antes da bola rolar.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {invite ? (
          <JoinGroupForm inviteToken={invite} />
        ) : (
          <section className="sport-card rounded-[1.75rem] p-5 sm:p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-danger">Acesso bloqueado</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">Convite inválido</h2>
            <p className="mt-2 text-muted">Peça ao administrador o link privado completo do bolão.</p>
          </section>
        )}
      </div>
    </main>
  );
}
