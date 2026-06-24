import { NextRequest } from "next/server";
import { getPredefinedMatchesByDate } from "@/lib/predefined-matches";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const todayInSaoPaulo = () => dateFormatter.format(new Date());

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? todayInSaoPaulo();
    const matches = getPredefinedMatchesByDate(date)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    return Response.json({ date, matches, source: "predefined" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar jogos disponíveis.";
    return Response.json({ error: message }, { status: 500 });
  }
}
