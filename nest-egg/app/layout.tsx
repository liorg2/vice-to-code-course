import type { Metadata } from "next";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { DM_Sans, Fraunces } from "next/font/google";
import { NestProviders } from "@/components/providers";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nest Egg",
  description: "A household net worth and retirement planner. A projection, not financial advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="min-h-full">
        <NestProviders>{children}</NestProviders>
      </body>
    </html>
  );
}
