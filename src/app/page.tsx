import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex-1">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1fr_420px] lg:items-center lg:py-24">
        {/* Hero content */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent" />
            Bolão entre amigos
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-7xl">
            Palpite, torça e <span className="text-accent">acompanhe</span> tudo pelo WhatsApp.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Crie grupos privados, escolha o jogo, receba por PIX e libere uma experiência simples para os participantes darem seus palpites.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              className="inline-flex cursor-pointer items-center rounded-full bg-accent px-8 py-4 font-display text-base font-bold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover hover:shadow-md"
              href="/admin"
            >
              Criar meu bolão
            </Link>
            <span className="inline-flex items-center rounded-full border border-line bg-surface px-8 py-4 font-semibold text-muted">
              Link privado para cada grupo
            </span>
          </div>

          {/* Feature highlights */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface p-4 transition-shadow duration-200 hover:shadow-sm">
              <svg className="mb-2 h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm font-semibold text-fg">PIX automático</p>
              <p className="mt-0.5 text-xs text-muted">Pagamento rápido e seguro</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4 transition-shadow duration-200 hover:shadow-sm">
              <svg className="mb-2 h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <p className="text-sm font-semibold text-fg">Ranking do grupo</p>
              <p className="mt-0.5 text-xs text-muted">Veja quem está na frente</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4 transition-shadow duration-200 hover:shadow-sm">
              <svg className="mb-2 h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm font-semibold text-fg">Notificações WhatsApp</p>
              <p className="mt-0.5 text-xs text-muted">Acompanhe tudo em tempo real</p>
            </div>
          </div>
        </div>

        {/* Scoreboard card */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="rounded-2xl border border-line bg-surface p-1 shadow-sm">
            <div className="rounded-xl bg-surface-alt p-5">
              <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">Copa do Mundo 2026 · Grupo F</p>
              <div className="mt-5 flex items-center justify-center gap-4">
                {/* Home team */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
                      <path strokeLinecap="round" d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="font-display text-sm font-bold text-fg">Brasil</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-display text-4xl font-extrabold text-accent">2</span>
                  <span className="font-display text-xl font-bold text-line">×</span>
                  <span className="tabular-nums font-display text-4xl font-extrabold text-fg">1</span>
                </div>
                {/* Away team */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/10">
                    <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
                      <path strokeLinecap="round" d="M12 2a15 15 0 0 0 0 20 15 15 0 0 0 0-20z" />
                    </svg>
                  </div>
                  <span className="font-display text-sm font-bold text-muted">Argentina</span>
                </div>
              </div>
              <p className="mt-4 text-center font-mono text-xs font-medium uppercase tracking-wider text-muted">
                Maracanã · Rio de Janeiro · 21h
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
