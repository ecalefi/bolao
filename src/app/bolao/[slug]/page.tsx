import { JoinGroupForm } from "@/components/join-group-form";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    .select("name,pix_amount_cents,bet_lock_minutes_before_match")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-yellow-50 to-sky-50 px-6 py-10 text-slate-950">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Bolão privado</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            {group?.name ?? "Bolão Copa do Mundo"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
            Entre com seu nome e WhatsApp, pague via PIX Mercado Pago e libere os palpites dos jogos do Brasil.
            Os palpites ficam abertos até 5 minutos antes da bola rolar.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">PIX automático</div>
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">Ranking por grupo</div>
            <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white">Gol no WhatsApp</div>
          </div>
        </section>

        {invite ? (
          <JoinGroupForm inviteToken={invite} />
        ) : (
          <section className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/10 ring-1 ring-emerald-100">
            <h2 className="text-2xl font-bold">Convite inválido</h2>
            <p className="mt-2 text-slate-600">Peça ao administrador o link privado completo do bolão.</p>
          </section>
        )}
      </div>
    </main>
  );
}
