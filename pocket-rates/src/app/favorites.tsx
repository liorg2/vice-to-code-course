import { ScrollView } from "react-native";
import { Button, List, Text, useTheme } from "react-native-paper";
import { useRates } from "@/components/rates-context";

export default function FavoritesScreen() {
  const theme = useTheme();
  const rates = useRates();
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12, backgroundColor: theme.colors.background, flexGrow: 1 }}>
      <Text variant="headlineMedium" style={{ color: theme.colors.secondary }}>
        Favorites
      </Text>
      {rates.favorites.length === 0 ? (
        <Text variant="bodyMedium">No saved pairs yet. Save one from Convert.</Text>
      ) : (
        rates.favorites.map((pair) => (
          <List.Item
            key={`${pair.from}-${pair.to}`}
            title={`${pair.from} to ${pair.to}`}
            left={(props) => <List.Icon {...props} icon="star" />}
          />
        ))
      )}
      <Text variant="titleMedium" style={{ marginTop: 12 }}>Settings</Text>
      <Button mode="contained" onPress={() => void rates.clear()} accessibilityLabel="Clear saved data">
        Clear saved data
      </Button>
    </ScrollView>
  );
}
