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
    <main className="min-h-screen overflow-hidden bg-[#071b12] px-6 py-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section>
          <p className="inline-flex rounded-full bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-emerald-950">
            Convite privado
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            {group?.name ?? "Bolão Copa do Mundo"}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-50/80">
            Entre no grupo, confirme seu WhatsApp, pague via PIX e registre seu palpite antes da bola rolar.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-emerald-50/80 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10"><strong className="text-yellow-200">1.</strong> Identifique-se</div>
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10"><strong className="text-yellow-200">2.</strong> Pague o PIX</div>
            <div className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10"><strong className="text-yellow-200">3.</strong> Dê seu palpite</div>
          </div>
          <div className="mt-8 rounded-[2rem] bg-gradient-to-br from-yellow-300/20 to-emerald-300/10 p-5 ring-1 ring-white/10">
            <p className="text-sm font-semibold text-yellow-100">🏆 Seu palpite entra no ranking privado do grupo.</p>
            <p className="mt-2 text-sm leading-6 text-emerald-50/70">Você pode acompanhar os jogos, atualizar palpites enquanto estiver liberado e receber avisos importantes pelo WhatsApp.</p>
          </div>
        </section>

        {invite ? (
          <JoinGroupForm inviteToken={invite} />
        ) : (
          <section className="rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl shadow-black/20 ring-1 ring-white/20">
            <h2 className="text-2xl font-bold">Convite inválido</h2>
            <p className="mt-2 text-slate-600">Peça ao administrador o link privado completo do bolão.</p>
          </section>
        )}
      </div>
    </main>
  );
}
