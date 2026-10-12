"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Slider,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { formatUSD } from "@/lib/money";
import { kidCurve, moneyLastsUntil, project } from "@/lib/project";
import type { Household, Plan } from "@/lib/model";

type Bundle = {
  me: { email: string; role: string };
  household: Household & { netWorthCents: number };
};

const VIEWS = ["Today", "Snapshot", "Retire", "Compare", "Kids"] as const;

async function send(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = (text ? JSON.parse(text) : null) as { error?: string } | null;
  return { ok: response.ok, status: response.status, payload };
}

export function Workspace() {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [view, setView] = useState<(typeof VIEWS)[number]>("Today");
  const [health, setHealth] = useState("checking");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("a@example.test");
  const [password, setPassword] = useState("nest-a");
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  async function refresh() {
    const session = await send("/api/session", "GET");
    if (session.status === 401) {
      setBundle(null);
      return;
    }
    setBundle(session.payload as Bundle);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    void fetch("/api/health")
      .then(async (response) => {
        const body = (await response.json()) as { status?: string; timestamp?: string };
        setHealth(response.ok && body.status === "ok" ? `up ${body.timestamp}` : "server error");
      })
      .catch(() => setHealth("unreachable"));
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result = await send("/api/session", "POST", { email, password });
    if (!result.ok) {
      setError(result.payload?.error ?? "Sign-in failed");
      return;
    }
    setBundle(result.payload as Bundle);
  }

  if (!bundle) {
    return (
      <Container size="xs" py={80}>
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Badge mb="sm">Practice data · Mantine</Badge>
          <Title order={1} mb="xs">Nest Egg</Title>
          <Text c="dimmed" mb="lg">A projection, not financial advice. Sign in with a sample household.</Text>
          <form onSubmit={signIn}>
            <Stack>
              <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
              <TextInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
              <Button type="submit">Sign in</Button>
              {error ? <Text c="red">{error}</Text> : null}
            </Stack>
          </form>
          <Text size="sm" c="dimmed" mt="md">
            a@example.test / nest-a · b@example.test / nest-b · c@example.test / nest-c
          </Text>
        </Card>
      </Container>
    );
  }

  const home = bundle.household;
  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1}>Nest Egg</Title>
              <Text size="sm" c="dimmed" mt={4}>
                {bundle.me.email} · <Badge size="sm">{bundle.me.role}</Badge> · server {health}
              </Text>
            </div>
            <Group>
              <Button variant="default" onClick={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}>
                Theme
              </Button>
              <Button
                variant="light"
                onClick={async () => {
                  await send("/api/session", "DELETE");
                  setBundle(null);
                }}
              >
                Sign out
              </Button>
            </Group>
          </Group>
        </Card>

        <SegmentedControl
          value={view}
          onChange={(value) => setView(value as (typeof VIEWS)[number])}
          data={[...VIEWS]}
          fullWidth
        />

        {error ? <Text c="red">{error}</Text> : null}
        {view === "Today" ? <Today home={home} /> : null}
        {view === "Snapshot" ? <SnapshotForm home={home} role={bundle.me.role} onDone={refresh} onError={setError} /> : null}
        {view === "Retire" ? <Retire home={home} /> : null}
        {view === "Compare" ? <Compare home={home} role={bundle.me.role} onDone={refresh} onError={setError} /> : null}
        {view === "Kids" ? <Kids home={home} /> : null}
      </Stack>
    </Container>
  );
}

function Today({ home }: { home: Bundle["household"] }) {
  const months = useMemo(() => {
    const map = new Map<string, number>();
    for (const snap of home.snapshots) {
      const account = home.accounts.find((item) => item.id === snap.accountId);
      if (!account) continue;
      const sign = account.type === "mortgage" || account.type === "other_debt" ? -1 : 1;
      map.set(snap.month, (map.get(snap.month) ?? 0) + sign * snap.balanceCents);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [home]);
  const first = months[0]?.[1] ?? home.netWorthCents;
  const last = months.at(-1)?.[1] ?? home.netWorthCents;
  const width = 560;
  const height = 160;
  const values = months.map(([, cents]) => cents);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const points = values
    .map((cents, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - ((cents - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text size="sm" c="dimmed">Net worth today</Text>
      <Title order={2}>{formatUSD(home.netWorthCents)}</Title>
      <Text size="sm" c="dimmed" mb="md">Change since first month: {formatUSD(last - first)}</Text>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Net worth history from ${formatUSD(first)} to ${formatUSD(last)}`} style={{ width: "100%", color: "var(--mantine-color-teal-7)" }}>
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} />
      </svg>
    </Card>
  );
}

function SnapshotForm({
  home,
  role,
  onDone,
  onError,
}: {
  home: Bundle["household"];
  role: string;
  onDone: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const latest = home.snapshots.map((s) => s.month).sort().at(-1) ?? "";
  const [month, setMonth] = useState(latest);
  const [balances, setBalances] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      home.accounts.map((account) => {
        const row = home.snapshots.filter((s) => s.accountId === account.id && s.month === latest).at(-1);
        return [account.id, row ? String(row.balanceCents / 100) : ""];
      }),
    ),
  );
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="xs">This month</Title>
      <Text c="dimmed" size="sm" mb="md">Update account balances for a snapshot month.</Text>
      <Stack>
        <TextInput label="Month" value={month} onChange={(e) => setMonth(e.currentTarget.value)} />
        {home.accounts.map((account) => (
          <TextInput
            key={account.id}
            label={account.name}
            inputMode="decimal"
            value={balances[account.id] ?? ""}
            onChange={(e) => setBalances({ ...balances, [account.id]: e.currentTarget.value })}
          />
        ))}
        <Button
          disabled={role === "viewer"}
          onClick={async () => {
            onError("");
            for (const account of home.accounts) {
              const dollars = Number(balances[account.id]);
              if (!Number.isFinite(dollars)) continue;
              const balanceCents = Math.round(dollars * 100);
              const existing = home.snapshots.find((snap) => snap.accountId === account.id && snap.month === month);
              const result = existing
                ? await send(`/api/records/snapshots/${existing.id}`, "PATCH", { balanceCents })
                : await send("/api/records/snapshots", "POST", { accountId: account.id, month, balanceCents });
              if (!result.ok) {
                onError(result.payload?.error ?? "Could not save");
                return;
              }
            }
            await onDone();
          }}
        >
          Save snapshot
        </Button>
      </Stack>
    </Card>
  );
}

function Retire({ home }: { home: Bundle["household"] }) {
  const plan = home.plans[0];
  const [age, setAge] = useState(plan?.retirementAges[home.people[0]?.id ?? ""] ?? 65);
  const [spend, setSpend] = useState(plan ? plan.monthlySpendCents / 100 : 7000);
  if (!plan) return <Text>No plan yet.</Text>;
  const trial: Plan = {
    ...plan,
    retirementAges: Object.fromEntries(home.people.map((person) => [person.id, age])),
    monthlySpendCents: Math.round(spend * 100) || 0,
  };
  const rows = project(home, trial);
  const lasts = moneyLastsUntil(rows, home.people);
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3}>When can we retire</Title>
      <Text c="dimmed" size="sm" mb="md">A projection, not financial advice.</Text>
      <Stack>
        <div>
          <Text size="sm" mb={6}>Retirement age {age}</Text>
          <Slider min={50} max={80} value={age} onChange={setAge} />
        </div>
        <NumberInput label="Monthly spending" value={spend} onChange={(value) => setSpend(Number(value) || 0)} min={0} />
        <Text>Money lasts until age {lasts ?? "beyond this projection"}.</Text>
      </Stack>
    </Card>
  );
}

function Compare({
  home,
  role,
  onDone,
  onError,
}: {
  home: Bundle["household"];
  role: string;
  onDone: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3}>Compare plans</Title>
      <Text c="dimmed" size="sm" mb="md">A projection, not financial advice.</Text>
      <Stack>
        {home.plans.map((plan) => {
          const rows = project(home, plan);
          const at60 = rows.find((row) => row.ages[home.people[0]?.id ?? ""] === 60);
          return (
            <Paper key={plan.id} withBorder p="sm" radius="md">
              <Text size="sm">
                <strong>{plan.name}</strong>: {at60 ? formatUSD(at60.netWorthCents) : "n/a"} at age 60
              </Text>
            </Paper>
          );
        })}
        {!home.pro ? <Text size="sm" c="dimmed">A third plan unlocks with a sample Pro payment.</Text> : null}
        {role !== "viewer" ? (
          <Group align="flex-end">
            <TextInput style={{ flex: 1 }} label="Plan name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
            <Button
              variant="light"
              onClick={async () => {
                const result = await send("/api/records/plans", "POST", {
                  name,
                  retirementAges: Object.fromEntries(home.people.map((person) => [person.id, 67])),
                  monthlySavingCents: 100000,
                  monthlySpendCents: 500000,
                  yearlyReturnPercent: 4,
                  yearlyInflationPercent: 2,
                  events: [],
                });
                if (!result.ok) onError(result.payload?.error ?? "Could not add the plan");
                else {
                  setName("");
                  await onDone();
                }
              }}
            >
              Add plan
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Card>
  );
}

function Kids({ home }: { home: Bundle["household"] }) {
  if (!home.pro) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={3}>Kids&apos; savings</Title>
        <Text c="dimmed">This screen unlocks with Pro. A projection, not financial advice.</Text>
      </Card>
    );
  }
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3}>Kids&apos; savings</Title>
      <Text c="dimmed" size="sm" mb="md">A projection, not financial advice.</Text>
      {home.kids.map((kid) => (
        <Text key={kid.id} mt="xs">
          {kid.name}: {formatUSD(kidCurve(kid).at(-1)?.cents ?? 0)} at age {kid.targetAge}
        </Text>
      ))}
    </Card>
  );
}
