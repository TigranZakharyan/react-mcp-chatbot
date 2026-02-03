interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  userBubble: string;
  userBubbleText: string;
  aiBubble: string;
  aiBubbleText: string;
  inputBg: string;
  inputBorder: string;
  inputFocus: string;
  scrollbar: string;
  scrollbarThumb: string;
  shadow: string;
  headerGlow: string;
}

export function buildTokens(accent: string, dark: boolean): ThemeTokens {
  if (dark) {
    return {
      bg: "#0f1117",
      surface: "#1a1d27",
      surfaceHover: "#232736",
      border: "#2a2e3d",
      text: "#e8eaf0",
      textMuted: "#7a7f8e",
      accent,
      accentHover: accent + "dd",
      userBubble: accent,
      userBubbleText: "#fff",
      aiBubble: "#1e2130",
      aiBubbleText: "#dce0e8",
      inputBg: "#141620",
      inputBorder: "#2a2e3d",
      inputFocus: accent,
      scrollbar: "transparent",
      scrollbarThumb: "#2a2e3d",
      shadow: "0 24px 64px rgba(0,0,0,.45)",
      headerGlow: accent + "22",
    };
  }
  return {
    bg: "#ffffff",
    surface: "#f4f6f9",
    surfaceHover: "#eef1f5",
    border: "#e2e5ec",
    text: "#1a1c23",
    textMuted: "#8a8f9e",
    accent,
    accentHover: accent + "ee",
    userBubble: accent,
    userBubbleText: "#fff",
    aiBubble: "#ffffff",
    aiBubbleText: "#1a1c23",
    inputBg: "#fff",
    inputBorder: "#e2e5ec",
    inputFocus: accent,
    scrollbar: "transparent",
    scrollbarThumb: "#d6d9e2",
    shadow: "0 24px 64px rgba(0,0,0,.12)",
    headerGlow: accent + "18",
  };
}