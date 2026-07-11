import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
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
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-full">
          <Sidebar />
          <main className="flex-1 px-10 py-10 md:px-14 md:py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
