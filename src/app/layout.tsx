import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DVRABLE",
  description:
    "The Agent-First Health System. Agentic AI for care navigation, symptom questions, cash pay doctor search, and health card visits.",
  openGraph: {
    title: "DVRABLE",
    description: "The Agent-First Health System",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DVRABLE",
    description: "The Agent-First Health System",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ebGaramond.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
