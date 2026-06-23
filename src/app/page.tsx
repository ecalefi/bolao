export default function Home() {
  return (
    <main className="min-h-screen bg-[#071b12] px-6 py-12 text-white">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">Copa do Mundo</p>
        <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">
          Bolão privado dos jogos do Brasil
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/80">
          Cadastro por nome + WhatsApp, pagamento PIX via Mercado Pago, palpites até 5 minutos antes do jogo,
          ranking por grupo e alerta de gol via n8n/WhatsApp.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a className="rounded-full bg-yellow-300 px-6 py-3 font-bold text-emerald-950" href="/admin">
            Criar grupo
          </a>
          <span className="rounded-full border border-white/20 px-6 py-3 text-emerald-50/80">
            Use o link privado para participantes
          </span>
        </div>
      </section>
    </main>
  );
}
