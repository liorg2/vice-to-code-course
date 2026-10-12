export const palette = {
  light: {
    background: "#f3f6f8",
    text: "#15202b",
    card: "#ffffff",
    muted: "#5b6b7c",
    accent: "#0f766e",
    chip: "#0369a1",
  },
  dark: {
    background: "#0f1720",
    text: "#e8eef4",
    card: "#17212b",
    muted: "#9aafc0",
    accent: "#2dd4bf",
    chip: "#38bdf8",
  },
} as const;

export function colorsFor(scheme: string | null | undefined) {
  return scheme === "dark" ? palette.dark : palette.light;
}
