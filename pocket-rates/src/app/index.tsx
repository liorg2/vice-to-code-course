import { ScrollView, View } from "react-native";
import { Button, Chip, HelperText, Text, TextInput, useTheme } from "react-native-paper";
import { useRates } from "@/components/rates-context";

export default function ConvertScreen() {
  const theme = useTheme();
  const rates = useRates();
  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 12, backgroundColor: theme.colors.background, minHeight: "100%" }}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
        Pocket Rates
      </Text>
      <HelperText type="info">{rates.status === "loading" ? "Loading rates" : rates.note}</HelperText>
      {rates.slow ? <HelperText type="info">Rates are loading slowly</HelperText> : null}

      <Text variant="labelLarge">From</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {rates.currencies.slice(0, 12).map((code) => (
          <Chip key={code} selected={rates.from === code} onPress={() => rates.setFrom(code)} accessibilityLabel={`From ${code}`}>
            {code}
          </Chip>
        ))}
      </View>

      <Text variant="labelLarge">To</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {rates.currencies.slice(0, 12).map((code) => (
          <Chip key={code} selected={rates.to === code} onPress={() => rates.setTo(code)} accessibilityLabel={`To ${code}`}>
            {code}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Amount"
        mode="outlined"
        keyboardType="decimal-pad"
        value={rates.amount}
        onChangeText={rates.setAmount}
        accessibilityLabel="Amount"
      />

      <Text variant="displaySmall" accessibilityLiveRegion="polite">
        {rates.result === null ? "Enter an amount" : rates.result.toFixed(2)}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button mode="contained" onPress={rates.swap}>Swap</Button>
        <Button mode="contained-tonal" onPress={rates.savePair}>Save pair</Button>
        <Button mode="outlined" onPress={rates.retry}>Retry</Button>
      </View>
    </ScrollView>
  );
}
