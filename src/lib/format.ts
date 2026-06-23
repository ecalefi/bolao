export const normalizeBrazilWhatsapp = (input: string) => {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
};

export const formatCurrencyFromCents = (cents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);

export const formatMatchTitle = (homeTeam: string, awayTeam: string) =>
  `${homeTeam} x ${awayTeam}`;
