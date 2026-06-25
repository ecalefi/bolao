import { AdminCreateGroupForm } from "@/components/admin-create-group-form";
import { AdminBetsDashboard } from "@/components/admin-bets-dashboard";

export default function AdminPage() {
  return (
    <main className="relative flex-1 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <section className="rounded-xl border border-line bg-surface p-6 md:p-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-accent">Configuração</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Painel do bolão
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
            Crie o grupo, defina o valor do PIX e compartilhe o link com os participantes. Eles entram com nome + WhatsApp e pagam antes de palpitar.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface-alt p-4">
              <strong className="font-display text-sm text-accent">1.</strong>
              <span className="ml-2 text-sm text-fg">Criar grupo e escolher jogo</span>
            </div>
            <div className="rounded-xl border border-line bg-surface-alt p-4">
              <strong className="font-display text-sm text-accent">2.</strong>
              <span className="ml-2 text-sm text-fg">Enviar link</span>
            </div>
            <div className="rounded-xl border border-line bg-surface-alt p-4">
              <strong className="font-display text-sm text-accent">3.</strong>
              <span className="ml-2 text-sm text-fg">Gerir palpites</span>
            </div>
          </div>
        </section>

        {/* Two-column layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="space-y-4">
            <div className="rounded-xl border border-accent/15 bg-accent/5 p-5">
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-accent">Cadastro</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">1. Grupo e convite</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Crie o grupo e selecione o jogo na mesma etapa. O link privado será gerado automaticamente.
              </p>
            </div>
            <AdminCreateGroupForm />
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-accent/15 bg-accent/5 p-5">
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-accent">Administração</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">2. Gestão dos palpites</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Entre com o slug do grupo e o WhatsApp admin. Você receberá um código e poderá consultar os palpites daquele grupo.
              </p>
            </div>
            <AdminBetsDashboard />
          </section>
        </div>

        <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm leading-6 text-muted">
          <strong className="font-display text-fg">Dica:</strong> para cada novo bolão, repita o fluxo: criar grupo com jogo → compartilhar o link privado.
        </div>
      </div>
    </main>
  );
}
