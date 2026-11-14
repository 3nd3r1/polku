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
  description: "A phone line for suspected lung cancer. A clock on every step.",
  openGraph: {
    title: "Every cancer pathway, on the clock.",
    description: "A phone line for suspected lung cancer. A clock on every step.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Polku: Every cancer pathway, on the clock." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Every cancer pathway, on the clock.",
    description: "A phone line for suspected lung cancer. A clock on every step.",
    images: ["/twitter-image.png"],
  },
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
