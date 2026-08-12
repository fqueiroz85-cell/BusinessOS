import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BusinessOS",
  description: "Sistema operacional pessoal para o negócio de um founder solo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Sidebar />
        {/* pl = largura da sidebar fixa (w-61). Ela sai do fluxo para ficar
            colada nas bordas e ocupar a altura inteira, como no layout alvo. */}
        <main className="min-h-full pl-61">
          <div className="mx-auto max-w-5xl px-6 py-10 md:px-12">{children}</div>
        </main>
      </body>
    </html>
  );
}
