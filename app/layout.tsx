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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
