import { AdminCreateGroupForm } from "@/components/admin-create-group-form";
import { AdminCreateMatchForm } from "@/components/admin-create-match-form";
import { AdminBetsDashboard } from "@/components/admin-bets-dashboard";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-yellow-50 to-sky-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] bg-white/70 p-6 shadow-xl shadow-emerald-950/5 ring-1 ring-white backdrop-blur md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Configuração</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Painel do bolão</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            Crie o grupo, defina o valor do PIX e compartilhe o link com os participantes. Eles entram com nome + WhatsApp e pagam antes de palpitar.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-700 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100"><strong>1.</strong> Criar grupo</div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100"><strong>2.</strong> Escolher jogo</div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100"><strong>3.</strong> Enviar link</div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100"><strong>4.</strong> Gerir palpites</div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <div className="rounded-3xl bg-emerald-900 p-5 text-white shadow-xl shadow-emerald-950/10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Cadastro</p>
              <h2 className="mt-2 text-2xl font-black">1. Grupo e convite</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                Crie um grupo por bolão. O WhatsApp admin será usado depois para acessar a gestão com OTP.
              </p>
            </div>
            <AdminCreateGroupForm />
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl bg-yellow-300 p-5 text-emerald-950 shadow-xl shadow-yellow-900/10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Partida</p>
              <h2 className="mt-2 text-2xl font-black">2. Jogo do grupo</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-950/80">
                Busque os jogos disponíveis por data e escolha qual partida vale para esse grupo.
              </p>
            </div>
            <AdminCreateMatchForm />
          </section>
        </div>

        <section className="mt-8">
          <div className="mb-4 rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Administração</p>
            <h2 className="mt-2 text-2xl font-black">3. Gestão dos palpites</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Entre com o slug do grupo e o WhatsApp admin. Você receberá um código e poderá consultar os palpites daquele grupo.
            </p>
          </div>
          <AdminBetsDashboard />
        </section>

        <div className="mt-8 rounded-3xl bg-white/80 p-5 text-sm leading-6 text-slate-600 ring-1 ring-white">
          <strong className="text-slate-950">Dica:</strong> para cada novo bolão, repita o fluxo: criar grupo → escolher o jogo pelo slug → compartilhar o link privado.
        </div>
      </div>
    </main>
  );
}
