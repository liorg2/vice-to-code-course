"use client";

import { MantineProvider, createTheme, type MantineColorsTuple } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const teal: MantineColorsTuple = [
  "#f0fdfa",
  "#ccfbf1",
  "#99f6e4",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#115e59",
  "#134e4a",
];

const sky: MantineColorsTuple = [
  "#f0f9ff",
  "#e0f2fe",
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9",
  "#0284c7",
  "#0369a1",
  "#075985",
  "#0c4a6e",
];

export function NestProviders({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    primaryColor: "teal",
    colors: { teal },
    fontFamily: "var(--font-sans), DM Sans, sans-serif",
    headings: { fontFamily: "var(--font-display), Fraunces, serif" },
    defaultRadius: "md",
  });
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  );
}

export function CrmProviders({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    primaryColor: "sky",
    colors: { sky },
    fontFamily: "var(--font-sans), DM Sans, sans-serif",
    headings: { fontFamily: "var(--font-display), Fraunces, serif" },
    defaultRadius: "md",
  });
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  );
}
