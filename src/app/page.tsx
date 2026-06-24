export default function Home() {
  return (
    <main className="scanlines relative min-h-screen overflow-hidden bg-[#0F0F23] px-6 py-10 text-slate-100">
      {/* Grid background */}
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl" />

      <section className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_400px] lg:items-center">
        <div>
          <p className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-300 transition-colors duration-200 hover:bg-violet-500/20">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            Bolão entre amigos
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.1] tracking-tight sm:text-7xl">
            Palpite, torça e <span className="neon-text text-violet-400">acompanhe</span> tudo pelo WhatsApp.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Crie grupos privados, escolha o jogo, receba por PIX e libere uma experiência simples para os participantes darem seus palpites.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              className="cursor-pointer rounded-full bg-rose-500 px-7 py-4 font-display text-white shadow-lg shadow-rose-500/30 transition-all duration-200 hover:bg-rose-600 hover:shadow-rose-500/40"
              href="/admin"
            >
              Criar meu bolão
            </a>
            <span className="rounded-full border border-slate-700 bg-slate-800/50 px-7 py-4 font-semibold text-slate-400">
              Link privado para cada grupo
            </span>
          </div>
          <div className="mt-10 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-4 transition-colors duration-200 hover:border-violet-500/50 hover:bg-slate-800/50">
              <svg className="mb-2 h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              PIX automático
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-4 transition-colors duration-200 hover:border-violet-500/50 hover:bg-slate-800/50">
              <svg className="mb-2 h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              Ranking do grupo
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-4 transition-colors duration-200 hover:border-violet-500/50 hover:bg-slate-800/50">
              <svg className="mb-2 h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Notificações no WhatsApp
            </div>
          </div>
        </div>

        {/* Game card mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -right-8 bottom-10 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-800 to-[#1A1A2E] p-2 shadow-2xl shadow-violet-900/30">
            <div className="rounded-2xl bg-[#0F0F23] p-5">
              <p className="font-display text-xs uppercase tracking-[0.25em] text-violet-400">Rodada de hoje</p>
              <div className="mt-5 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-rose-500/10 p-5 text-white neon-border">
                <p className="text-sm text-slate-400">Final do grupo</p>
                <h2 className="mt-3 font-display text-2xl">Brasil x Argentina</h2>
                <div className="mt-5 flex items-center justify-center gap-3 font-display text-3xl">
                  <span className="rounded-xl bg-slate-800 px-5 py-3 text-violet-300 ring-1 ring-violet-500/30">2</span>
                  <span className="text-slate-500">×</span>
                  <span className="rounded-xl bg-slate-800 px-5 py-3 text-rose-400 ring-1 ring-rose-500/30">1</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">Palpite</div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">PIX</div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3">Ranking</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}