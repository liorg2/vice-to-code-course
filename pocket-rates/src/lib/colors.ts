export const palette = {
  light: { background: "#f4f7fb", text: "#142033", card: "#ffffff", muted: "#4d5b70", accent: "#1d4e89" },
  dark: { background: "#10141c", text: "#f4f7fb", card: "#1c2430", muted: "#b7c3d4", accent: "#8eb7e8" },
} as const;

export function colorsFor(scheme: string | null | undefined) {
  return scheme === "dark" ? palette.dark : palette.light;
}
