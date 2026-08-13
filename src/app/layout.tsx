import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lora, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: "RemitSplit — Programmable Cross-Border Remittance Splitting on Stellar",
  description:
    "Deposit once and automatically split cross-border remittances among family members with programmable on-chain rules and transparent audit trails on Stellar Soroban.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${lora.variable} ${playfair.variable} font-body bg-[#F9F9F7] text-[#111111] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
