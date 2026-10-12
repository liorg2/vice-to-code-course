import { Pressable, ScrollView, Text, TextInput, View, type ViewProps } from "react-native";
import { useColorScheme } from "react-native";
import { useRates } from "@/components/rates-context";
import { colorsFor } from "@/lib/colors";

export default function ConvertScreen() {
  const scheme = useColorScheme();
  const colors = colorsFor(scheme);
  const rates = useRates();
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12, backgroundColor: colors.background, minHeight: "100%" }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: colors.accent, borderRadius: 20, padding: 16 }}>
        <Text accessibilityRole="header" style={{ color: "#fffaf3", fontSize: 32, fontWeight: "700" }}>Pocket Rates</Text>
      </View>
      <Text style={{ color: colors.muted }}>{rates.status === "loading" ? "Loading rates" : rates.note}</Text>
      {rates.slow ? <Text style={{ color: colors.muted }}>Rates are loading slowly</Text> : null}
      <Field label="From" value={rates.from} onChange={rates.setFrom} colors={colors} choices={rates.currencies} />
      <Field label="To" value={rates.to} onChange={rates.setTo} colors={colors} choices={rates.currencies} />
      <Text style={{ color: colors.text }}>Amount</Text>
      <TextInput
        accessibilityLabel="Amount"
        accessibilityRole="text"
        keyboardType="decimal-pad"
        value={rates.amount}
        onChangeText={rates.setAmount}
        style={{ minHeight: 48, borderWidth: 1, borderColor: colors.muted, borderRadius: 12, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.card, fontSize: 18 }}
      />
      <Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 28 }}>
        {rates.result === null ? "Enter an amount" : rates.result.toFixed(2)}
      </Text>
      <Row>
        <Btn label="Swap currencies" onPress={rates.swap} colors={colors} />
        <Btn label="Save pair" onPress={rates.savePair} colors={colors} />
        <Btn label="Retry" onPress={rates.retry} colors={colors} />
      </Row>
    </ScrollView>
  );
}

function Field({ label, value, onChange, colors, choices }: { label: string; value: string; onChange: (v: string) => void; colors: ReturnType<typeof colorsFor>; choices: string[] }) {
  return (
    <View>
      <Text style={{ color: colors.text }}>{label}</Text>
      <ScrollView horizontal contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {choices.slice(0, 12).map((code) => (
          <Pressable key={code} accessibilityRole="button" accessibilityLabel={`${label} ${code}`} onPress={() => onChange(code)} style={{ minHeight: 44, minWidth: 64, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: value === code ? colors.chip : colors.card }}>
            <Text style={{ color: value === code ? "#ffffff" : colors.text }}>{code}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Row({ children }: { children: ViewProps["children"] }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}

function Btn({ label, onPress, colors }: { label: string; onPress: () => void; colors: ReturnType<typeof colorsFor> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minHeight: 48, minWidth: 48, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.background }}>{label}</Text>
    </Pressable>
  );
}
