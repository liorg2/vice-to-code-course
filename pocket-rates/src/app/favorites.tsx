import { Pressable, ScrollView, Text, View } from "react-native";
import { useColorScheme } from "react-native";
import { useRates } from "@/components/rates-context";
import { colorsFor } from "@/lib/colors";

export default function FavoritesScreen() {
  const colors = colorsFor(useColorScheme());
  const rates = useRates();
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12, backgroundColor: colors.background, flexGrow: 1 }}>
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 32, fontWeight: "700" }}>Favorites</Text>
      {rates.favorites.length === 0 ? <Text style={{ color: colors.muted }}>No saved pairs yet. Save one from Convert.</Text> : null}
      {rates.favorites.map((pair) => (
        <View key={`${pair.from}-${pair.to}`} style={{ minHeight: 48, justifyContent: "center" }}>
          <Text style={{ color: colors.text, fontSize: 18 }}>{pair.from} to {pair.to}</Text>
        </View>
      ))}
      <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 20, marginTop: 12 }}>Settings</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Clear saved data" onPress={() => void rates.clear()} style={{ minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.card }}>
        <Text style={{ color: colors.text }}>Clear saved data</Text>
      </Pressable>
    </ScrollView>
  );
}
