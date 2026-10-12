"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatUSD } from "@/lib/money";
import { kidCurve, moneyLastsUntil, project } from "@/lib/project";
import type { Household, Plan } from "@/lib/model";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Page,
  Shell,
} from "@/components/ds";

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
        console.log(`browser health ${body.status}`);
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
      <Shell>
        <Page className="max-w-md justify-center py-16">
          <Card>
            <CardHeader>
              <Badge>Practice data</Badge>
              <CardTitle className="text-3xl">Nest Egg</CardTitle>
              <CardDescription>A projection, not financial advice. Sign in with a sample household.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={signIn} className="flex flex-col gap-3">
                <Field label="Email">
                  <Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
                </Field>
                <Field label="Password">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
                </Field>
                <Button type="submit">Sign in</Button>
                {error ? <p className="text-sm text-[var(--destructive)]">{error}</p> : null}
              </form>
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                a@example.test / nest-a · b@example.test / nest-b · c@example.test / nest-c
              </p>
            </CardContent>
          </Card>
        </Page>
      </Shell>
    );
  }

  const home = bundle.household;
  return (
    <Shell>
      <Page>
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">Nest Egg</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {bundle.me.email} · <Badge className="align-middle">{bundle.me.role}</Badge> · server {health}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  document.documentElement.dataset.theme =
                    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
                }}
              >
                Theme
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={async () => {
                  await send("/api/session", "DELETE");
                  setBundle(null);
                }}
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {VIEWS.map((item) => (
            <Button
              key={item}
              type="button"
              variant={view === item ? "default" : "outline"}
              aria-current={view === item ? "page" : undefined}
              onClick={() => setView(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        {error ? <p className="text-sm text-[var(--destructive)]">{error}</p> : null}
        {view === "Today" ? <Today home={home} /> : null}
        {view === "Snapshot" ? <SnapshotForm home={home} role={bundle.me.role} onDone={refresh} onError={setError} /> : null}
        {view === "Retire" ? <Retire home={home} /> : null}
        {view === "Compare" ? <Compare home={home} role={bundle.me.role} onDone={refresh} onError={setError} /> : null}
        {view === "Kids" ? <Kids home={home} /> : null}
      </Page>
    </Shell>
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
    <Card>
      <CardHeader>
        <CardDescription>Net worth today</CardDescription>
        <CardTitle className="text-3xl">{formatUSD(home.netWorthCents)}</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">Change since first month: {formatUSD(last - first)}</p>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Net worth history from ${formatUSD(first)} to ${formatUSD(last)}`}
          className="w-full text-[var(--primary)]"
        >
          <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} />
        </svg>
      </CardContent>
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
  const readOnly = role === "viewer";
  return (
    <Card>
      <CardHeader>
        <CardTitle>This month</CardTitle>
        <CardDescription>Update account balances for a snapshot month.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field label="Month">
          <Input value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Snapshot month" />
        </Field>
        {home.accounts.map((account) => (
          <Field key={account.id} label={account.name}>
            <Input
              inputMode="decimal"
              aria-label={`${account.name} balance`}
              value={balances[account.id] ?? ""}
              onChange={(e) => setBalances({ ...balances, [account.id]: e.target.value })}
            />
          </Field>
        ))}
        <Button
          type="button"
          disabled={readOnly}
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
      </CardContent>
    </Card>
  );
}

function Retire({ home }: { home: Bundle["household"] }) {
  const plan = home.plans[0];
  const [age, setAge] = useState(plan?.retirementAges[home.people[0]?.id ?? ""] ?? 65);
  const [spend, setSpend] = useState(plan ? String(plan.monthlySpendCents / 100) : "7000");
  if (!plan) return <p>No plan yet.</p>;
  const trial: Plan = {
    ...plan,
    retirementAges: Object.fromEntries(home.people.map((person) => [person.id, age])),
    monthlySpendCents: Math.round(Number(spend) * 100) || 0,
  };
  const rows = project(home, trial);
  const lasts = moneyLastsUntil(rows, home.people);
  return (
    <Card>
      <CardHeader>
        <CardTitle>When can we retire</CardTitle>
        <CardDescription>A projection, not financial advice.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field label={`Retirement age ${age}`}>
          <input
            className="w-full accent-[var(--primary)]"
            type="range"
            min={50}
            max={80}
            value={age}
            aria-label="Retirement age"
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </Field>
        <Field label="Monthly spending">
          <Input inputMode="decimal" aria-label="Monthly spending" value={spend} onChange={(e) => setSpend(e.target.value)} />
        </Field>
        <p className="text-sm">Money lasts until age {lasts ?? "beyond this projection"}.</p>
      </CardContent>
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
    <Card>
      <CardHeader>
        <CardTitle>Compare plans</CardTitle>
        <CardDescription>A projection, not financial advice.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {home.plans.map((plan) => {
            const rows = project(home, plan);
            const at60 = rows.find((row) => row.ages[home.people[0]?.id ?? ""] === 60);
            return (
              <li key={plan.id} className="rounded-[calc(var(--radius)-4px)] bg-[var(--muted)] px-3 py-3 text-sm">
                <strong>{plan.name}</strong>: {at60 ? formatUSD(at60.netWorthCents) : "n/a"} at age 60
              </li>
            );
          })}
        </ul>
        {!home.pro ? <p className="text-sm text-[var(--muted-foreground)]">A third plan unlocks with a sample Pro payment.</p> : null}
        {role !== "viewer" ? (
          <form
            className="flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
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
            <Input aria-label="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" variant="secondary">
              Add plan
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Kids({ home }: { home: Bundle["household"] }) {
  if (!home.pro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kids&apos; savings</CardTitle>
          <CardDescription>This screen unlocks with Pro. A projection, not financial advice.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kids&apos; savings</CardTitle>
        <CardDescription>A projection, not financial advice.</CardDescription>
      </CardHeader>
      <CardContent>
        {home.kids.map((kid) => (
          <p key={kid.id} className="mt-2 text-sm">
            {kid.name}: {formatUSD(kidCurve(kid).at(-1)?.cents ?? 0)} at age {kid.targetAge}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
