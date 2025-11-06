import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "@/app/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aska Flow",
  description:
    "Plataforma que permite la creación y ejecución de flujos de automatización mediante IA, integrada con n8n.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="en">
        <body className={`${geistSans.variable} antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
