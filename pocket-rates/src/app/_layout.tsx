import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { RatesProvider } from "@/components/rates-context";

SplashScreen.preventAutoHideAsync();

const light = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#0f766e",
    secondary: "#0369a1",
    background: "#f3f6f8",
    surface: "#ffffff",
  },
};

const dark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#2dd4bf",
    secondary: "#38bdf8",
    background: "#0f1720",
    surface: "#17212b",
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const paper = colorScheme === "dark" ? dark : light;
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <PaperProvider theme={paper}>
        <AnimatedSplashOverlay />
        <RatesProvider>
          <AppTabs />
        </RatesProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
