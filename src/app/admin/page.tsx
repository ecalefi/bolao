import { AdminCreateGroupForm } from "@/components/admin-create-group-form";
import { AdminCreateMatchForm } from "@/components/admin-create-match-form";
import { AdminBetsDashboard } from "@/components/admin-bets-dashboard";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-yellow-50 to-sky-50 px-6 py-10 text-slate-950">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Configuração</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Monte seu bolão privado</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Crie o grupo, defina o valor do PIX e compartilhe o link com os participantes. Eles entram com nome + WhatsApp e pagam antes de palpitar.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">Valor fixo por grupo</div>
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">Convite privado</div>
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">PIX Mercado Pago</div>
          </div>
        </section>
        <div>
          <AdminCreateGroupForm />
          <AdminCreateMatchForm />
          <AdminBetsDashboard />
        </div>
      </div>
    </main>
  );
}
