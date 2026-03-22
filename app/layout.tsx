import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FamilyDataProvider } from "@/components/FamilyDataProvider";
import { FamilyOnboardingGate } from "@/components/FamilyOnboardingGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Noche de Hogar",
  description:
    "Planificador web para organizar la Noche de Hogar: agenda y familia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <FamilyDataProvider>
            <FamilyOnboardingGate>{children}</FamilyOnboardingGate>
          </FamilyDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
