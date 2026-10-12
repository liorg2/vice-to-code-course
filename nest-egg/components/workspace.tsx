"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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

  async function refresh() {
    const session = await send("/api/session", "GET");
    if (session.status === 401) {
      setBundle(null);
      return;
    }
    setBundle(session.payload as Bundle);
  }

  useEffect(() => {
    // Load the signed-in household once when the screen opens.
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
      <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-3xl font-semibold">Nest Egg</h1>
        <p>A projection, not financial advice. Practice accounts only.</p>
        <form onSubmit={signIn} className="flex flex-col gap-3">
          <input className="min-h-11 rounded border px-3" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <input className="min-h-11 rounded border px-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
          <button className="min-h-11 rounded bg-[var(--accent)] text-white" type="submit">Sign in</button>
          {error ? <p>{error}</p> : null}
        </form>
        <p className="text-sm">a@example.test / nest-a (owner), b@example.test / nest-b (other household), c@example.test / nest-c (viewer)</p>
      </main>
    );
  }

  const home = bundle.household;
  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Nest Egg</h1>
          <p className="text-sm">{bundle.me.email} · {bundle.me.role} · server {health}</p>
        </div>
        <div className="flex gap-2">
          <button className="min-h-11 rounded border px-3" type="button" onClick={() => document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark"}>Theme</button>
          <button className="min-h-11 rounded border px-3" type="button" onClick={async () => { await send("/api/session", "DELETE"); setBundle(null); }}>Sign out</button>
        </div>
      </header>
      <nav className="flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <button key={item} className="min-h-11 rounded border px-3" type="button" onClick={() => setView(item)} aria-current={view === item}>{item}</button>
        ))}
      </nav>
      {error ? <p className="text-red-700">{error}</p> : null}
      {view === "Today" ? <Today home={home} /> : null}
      {view === "Snapshot" ? <SnapshotForm home={home} role={bundle.me.role} onDone={refresh} onError={setError} /> : null}
      {view === "Retire" ? <Retire home={home} /> : null}
      {view === "Compare" ? <Compare home={home} role={bundle.me.role} onDone={refresh} onError={setError} /> : null}
      {view === "Kids" ? <Kids home={home} /> : null}
    </main>
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
  const points = values.map((cents, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - ((cents - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <section className="rounded border p-4">
      <h2 className="text-xl">Net worth {formatUSD(home.netWorthCents)}</h2>
      <p>Change since the first saved month: {formatUSD(last - first)}</p>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Net worth history from ${formatUSD(first)} to ${formatUSD(last)}`} className="mt-4 w-full">
        <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} />
      </svg>
    </section>
  );
}

function SnapshotForm({ home, role, onDone, onError }: { home: Bundle["household"]; role: string; onDone: () => Promise<void>; onError: (msg: string) => void }) {
  const latest = home.snapshots.map((s) => s.month).sort().at(-1) ?? "";
  const [month, setMonth] = useState(latest);
  const [balances, setBalances] = useState<Record<string, string>>(() => Object.fromEntries(home.accounts.map((account) => {
    const row = home.snapshots.filter((s) => s.accountId === account.id && s.month === latest).at(-1);
    return [account.id, row ? String(row.balanceCents / 100) : ""];
  })));
  const readOnly = role === "viewer";
  return (
    <section className="rounded border p-4">
      <h2 className="text-xl">This month</h2>
      <label className="mt-3 block">Month
        <input className="mt-1 min-h-11 w-full rounded border px-3" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Snapshot month" />
      </label>
      {home.accounts.map((account) => (
        <label key={account.id} className="mt-3 block">{account.name}
          <input className="mt-1 min-h-11 w-full rounded border px-3 text-base" inputMode="decimal" aria-label={`${account.name} balance`} value={balances[account.id] ?? ""} onChange={(e) => setBalances({ ...balances, [account.id]: e.target.value })} />
        </label>
      ))}
      <button className="mt-4 min-h-11 rounded bg-[var(--accent)] px-4 text-white" type="button" disabled={readOnly} onClick={async () => {
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
      }}>Save snapshot</button>
    </section>
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
    <section className="rounded border p-4">
      <h2 className="text-xl">When can we retire</h2>
      <p>A projection, not financial advice.</p>
      <label className="mt-3 block">Retirement age {age}
        <input className="mt-1 w-full" type="range" min={50} max={80} value={age} aria-label="Retirement age" onChange={(e) => setAge(Number(e.target.value))} />
      </label>
      <label className="mt-3 block">Monthly spending
        <input className="mt-1 min-h-11 w-full rounded border px-3" inputMode="decimal" aria-label="Monthly spending" value={spend} onChange={(e) => setSpend(e.target.value)} />
      </label>
      <p className="mt-3">Money lasts until age {lasts ?? "beyond this projection"}.</p>
    </section>
  );
}

function Compare({ home, role, onDone, onError }: { home: Bundle["household"]; role: string; onDone: () => Promise<void>; onError: (msg: string) => void }) {
  const [name, setName] = useState("");
  return (
    <section className="rounded border p-4">
      <h2 className="text-xl">Compare plans</h2>
      <p>A projection, not financial advice.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {home.plans.map((plan) => {
          const rows = project(home, plan);
          const at60 = rows.find((row) => row.ages[home.people[0]?.id ?? ""] === 60);
          return <li key={plan.id}>{plan.name}: {at60 ? formatUSD(at60.netWorthCents) : "n/a"} at age 60</li>;
        })}
      </ul>
      {!home.pro ? <p className="mt-3 text-sm">A third plan unlocks with a sample Pro payment.</p> : null}
      {role !== "viewer" ? (
        <form className="mt-3 flex gap-2" onSubmit={async (event) => {
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
          else { setName(""); await onDone(); }
        }}>
          <input className="min-h-11 flex-1 rounded border px-3" aria-label="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="min-h-11 rounded border px-3" type="submit">Add plan</button>
        </form>
      ) : null}
    </section>
  );
}

function Kids({ home }: { home: Bundle["household"] }) {
  if (!home.pro) return <section className="rounded border p-4"><h2 className="text-xl">Kids&apos; savings</h2><p>This screen unlocks with Pro. A projection, not financial advice.</p></section>;
  return (
    <section className="rounded border p-4">
      <h2 className="text-xl">Kids&apos; savings</h2>
      <p>A projection, not financial advice.</p>
      {home.kids.map((kid) => (
        <p key={kid.id} className="mt-2">{kid.name}: {formatUSD(kidCurve(kid).at(-1)?.cents ?? 0)} at age {kid.targetAge}</p>
      ))}
    </section>
  );
}
