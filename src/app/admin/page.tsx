import { AdminCreateGroupForm } from "@/components/admin-create-group-form";
import { AdminBetsDashboard } from "@/components/admin-bets-dashboard";

export default function AdminPage() {
  return (
    <main className="scanlines relative min-h-screen overflow-hidden bg-[#0F0F23] px-6 py-10 text-slate-100">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-rose-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-700 bg-slate-800/40 p-6 shadow-xl shadow-violet-900/10 backdrop-blur-sm md:p-8">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-violet-400">Configuração</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl tracking-tight sm:text-6xl">Painel do bolão</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            Crie o grupo, defina o valor do PIX e compartilhe o link com os participantes. Eles entram com nome + WhatsApp e pagam antes de palpitar.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-400 md:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4"><strong className="font-display text-violet-400">1.</strong> Criar grupo e escolher jogo</div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4"><strong className="font-display text-violet-400">2.</strong> Enviar link</div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/30 p-4"><strong className="font-display text-violet-400">3.</strong> Gerir palpites</div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5 shadow-xl shadow-violet-900/10">
              <p className="font-display text-sm uppercase tracking-[0.2em] text-violet-300">Cadastro</p>
              <h2 className="mt-2 font-display text-2xl">1. Grupo e convite</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Crie o grupo e selecione o jogo na mesma etapa. O link privado será gerado automaticamente.
              </p>
            </div>
            <AdminCreateGroupForm />
          </section>

          <section className="space-y-4">
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 shadow-xl shadow-rose-900/10">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-rose-300">Administração</p>
            <h2 className="mt-2 font-display text-2xl">2. Gestão dos palpites</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Entre com o slug do grupo e o WhatsApp admin. Você receberá um código e poderá consultar os palpites daquele grupo.
            </p>
          </div>
          <AdminBetsDashboard />
          </section>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/40 p-5 text-sm leading-6 text-slate-400">
          <strong className="font-display text-slate-100">Dica:</strong> para cada novo bolão, repita o fluxo: criar grupo com jogo → compartilhar o link privado.
        </div>
      </div>
    </main>
  );
}
