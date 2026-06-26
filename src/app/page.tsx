import Link from "next/link";

const features = [
  {
    title: "PIX e entrada controlada",
    description: "O participante só avança para os palpites depois da confirmação do pagamento.",
  },
  {
    title: "Link privado por grupo",
    description: "Cada bolão tem convite próprio para manter a rodada fechada entre amigos.",
  },
  {
    title: "Palpite com clima de jogo",
    description: "Placar, horário e ranking do grupo ficam claros antes da bola rolar.",
  },
];

export default function Home() {
  return (
    <main className="app-shell relative flex-1 overflow-hidden">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-14">
        <div className="sport-panel rounded-[1.75rem] p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-accent">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent" />
              Bolão Copa Brasil
            </p>
            <p className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold-text">
              Jogo fechado
            </p>
          </div>

          <h1 className="mt-8 max-w-4xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-fg sm:text-6xl lg:text-7xl">
            O bolão dos jogos do Brasil com cara de casa de apostas.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Crie o grupo, defina o valor, compartilhe o convite privado e deixe cada participante confirmar o PIX antes de registrar o placar.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-accent px-7 py-3 font-display text-base font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/30"
              href="/admin"
            >
              Criar meu bolão
            </Link>
            <span className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-surface-alt px-7 py-3 text-sm font-bold text-fg">
              WhatsApp, PIX e palpite no mesmo fluxo
            </span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {features.map((feature, index) => (
              <article className="market-strip rounded-2xl p-4" key={feature.title}>
                <p className="font-mono text-xs font-bold text-accent">0{index + 1}</p>
                <h2 className="mt-3 font-display text-base font-extrabold text-fg">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="sport-card relative mx-auto w-full max-w-xl overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
          <div className="rounded-3xl bg-surface-strong p-5 text-white">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                  Copa do Mundo 2026
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold">Rodada do grupo</h2>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white">
                Aberto
              </span>
            </div>

            <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/8">
                  <span className="font-display text-3xl font-extrabold text-gold">BR</span>
                </div>
                <p className="mt-3 font-display text-lg font-extrabold">Brasil</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-center text-fg shadow-sm">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Palpite</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
                  2 <span className="text-muted">×</span> 1
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/8">
                  <span className="font-display text-3xl font-extrabold text-white">JP</span>
                </div>
                <p className="mt-3 font-display text-lg font-extrabold">Japão</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Entrada</p>
                <p className="mt-2 font-display text-xl font-extrabold">PIX</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Grupo</p>
                <p className="mt-2 font-display text-xl font-extrabold">Privado</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Status</p>
                <p className="mt-2 font-display text-xl font-extrabold">Antes do jogo</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="rounded-2xl border border-line bg-surface-alt p-4">
              <p className="font-display text-sm font-extrabold text-fg">Operação simples para o administrador</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Criação do grupo, geração de convite e gestão dos palpites seguem no painel atual.
              </p>
            </div>
            <div className="gold-ticket rounded-2xl px-5 py-4 text-center">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Prêmio</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-gold-text">1º lugar</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
