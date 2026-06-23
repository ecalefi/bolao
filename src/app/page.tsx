export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071b12] px-6 py-10 text-white">
      <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-yellow-200 ring-1 ring-white/10">
            Bolão entre amigos
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">
            Palpite, torça e acompanhe tudo pelo WhatsApp.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/80">
            Crie grupos privados, escolha o jogo, receba por PIX e libere uma experiência simples para os participantes darem seus palpites.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a className="rounded-full bg-yellow-300 px-7 py-4 font-black text-emerald-950 shadow-2xl shadow-yellow-500/20 transition hover:-translate-y-0.5 hover:bg-yellow-200" href="/admin">
              Criar meu bolão
            </a>
            <span className="rounded-full border border-white/15 bg-white/5 px-7 py-4 font-semibold text-emerald-50/80">
              Link privado para cada grupo
            </span>
          </div>
          <div className="mt-10 grid gap-3 text-sm text-emerald-50/80 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">⚡ PIX automático</div>
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">🏆 Ranking do grupo</div>
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">📲 Notificações no WhatsApp</div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-yellow-300/30 blur-3xl" />
          <div className="absolute -right-8 bottom-10 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="relative rounded-[2.2rem] bg-gradient-to-br from-yellow-300 via-emerald-300 to-sky-300 p-2 shadow-2xl shadow-black/30">
            <div className="rounded-[1.8rem] bg-[#071b12] p-5">
              <div className="rounded-[1.5rem] bg-white p-5 text-slate-950">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Rodada de hoje</p>
                <div className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-900 p-5 text-white">
                  <p className="text-sm text-emerald-100">Final do grupo</p>
                  <h2 className="mt-3 text-2xl font-black">Brasil x Argentina</h2>
                  <div className="mt-5 flex items-center justify-center gap-3 text-3xl font-black">
                    <span className="rounded-2xl bg-white px-5 py-3 text-emerald-950">2</span>
                    <span>x</span>
                    <span className="rounded-2xl bg-white px-5 py-3 text-emerald-950">1</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
                  <div className="rounded-2xl bg-yellow-100 p-3">Palpite</div>
                  <div className="rounded-2xl bg-emerald-100 p-3">PIX</div>
                  <div className="rounded-2xl bg-sky-100 p-3">Ranking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
