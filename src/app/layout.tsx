import type { Metadata } from "next";
import { Nunito, Poetsen_One, Inconsolata } from "next/font/google";

import "./globals.css";

export const metadata: Metadata = {
  title: "DailyRoom",
  description: "Crea tu sala y lleva la Daily a otro nivel",
};

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
});

const poetsen_one = Poetsen_One({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-poetsen",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-inconsolata",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${poetsen_one.variable} ${inconsolata.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
