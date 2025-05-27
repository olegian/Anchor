import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Anchor",
  description: "",
};

import { Inter, Inter_Tight } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased font-sans w-screen overflow-x-hidden`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
