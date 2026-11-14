import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PhoneProvider } from "@/components/agent-call";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polku",
  description: "Polku does the handoffs between cancer care steps. Prototype with synthetic data.",
  // Tell the Dark Reader extension the page is already dark.
  other: { "darkreader-lock": "" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full flex-col">
        <PhoneProvider>
          <Nav />
          {children}
        </PhoneProvider>
      </body>
    </html>
  );
}
