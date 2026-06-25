import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bolão Copa Brasil",
  description:
    "Bolão privado para os jogos do Brasil na Copa do Mundo. Crie grupos, convide amigos e acompanhe os palpites pelo WhatsApp.",
  openGraph: {
    title: "Bolão Copa Brasil",
    description:
      "Bolão privado para os jogos do Brasil na Copa do Mundo. Crie grupos, convide amigos e acompanhe os palpites pelo WhatsApp.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg font-body text-fg">
        {children}
      </body>
    </html>
  );
}
