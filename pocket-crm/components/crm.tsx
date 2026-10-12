"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Activity, Contact, Deal, Stage } from "@/lib/model";

type Payload = {
  me: { name: string; email: string };
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
};

const STAGES: Stage[] = ["lead", "qualified", "proposal", "won", "lost"];

async function api(method: string, body?: unknown) {
  const response = await fetch("/api/session", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, payload: text ? JSON.parse(text) as Payload & { error?: string; errors?: Record<string, string> } : null };
}

export function Crm() {
  const [data, setData] = useState<Payload | null>(null);
  const [email, setEmail] = useState("a@example.test");
  const [password, setPassword] = useState("crm-a");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function load() {
    const result = await api("GET");
    if (result.status === 401) setData(null);
    else setData(result.payload);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const result = await api("POST", { email, password });
    if (!result.ok || !result.payload) {
      setError("Those details do not match");
      return;
    }
    setData(result.payload);
  }

  const contacts = useMemo(() => {
    if (!data) return [];
    return data.contacts.filter((contact) => {
      const hay = `${contact.name} ${contact.company} ${contact.email}`.toLowerCase();
      return hay.includes(query.toLowerCase()) && (tag === "" || contact.tags.includes(tag));
    });
  }, [data, query, tag]);

  if (!data) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-3xl font-semibold">Pocket CRM</h1>
        <p>Practice contacts only. Nothing here is a real customer.</p>
        <form onSubmit={signIn} className="flex flex-col gap-3">
          <input className="min-h-11 rounded border px-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <input className="min-h-11 rounded border px-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
          <button className="min-h-11 rounded bg-[var(--accent)] text-white" type="submit">Sign in</button>
          {error ? <p>{error}</p> : null}
        </form>
        <p className="text-sm">a@example.test / crm-a and b@example.test / crm-b see different contacts.</p>
      </main>
    );
  }

  const openDeals = data.deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
  const won = data.deals.filter((deal) => deal.stage === "won").reduce((sum, deal) => sum + deal.valueCents, 0);
  const tasks = data.activities.filter((item) => item.kind === "task" && !item.done);
  const selected = data.contacts.find((contact) => contact.id === open);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pocket CRM</h1>
          <p className="text-sm">Signed in as {data.me.name}. {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Supabase is connected." : "Supabase is not configured, so this browser uses the local practice file."}</p>
        </div>
        <button className="min-h-11 rounded border px-3" type="button" onClick={async () => { await api("DELETE"); setData(null); }}>Sign out</button>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <Card title="Open deals" value={`$${(openDeals.reduce((s, d) => s + d.valueCents, 0) / 100).toLocaleString()}`} />
        <Card title="Won" value={`$${(won / 100).toLocaleString()}`} />
        <Card title="Open tasks" value={String(tasks.length)} />
      </section>
      <div className="flex flex-wrap gap-2">
        <input className="min-h-11 flex-1 rounded border px-3" placeholder="Search contacts" aria-label="Search contacts" value={query} onChange={(e) => setQuery(e.target.value)} />
        <input className="min-h-11 rounded border px-3" placeholder="Tag" aria-label="Tag filter" value={tag} onChange={(e) => setTag(e.target.value)} />
        <button className="min-h-11 rounded border px-3" type="button" onClick={() => setSearching(true)}>Search (Ctrl+K)</button>
      </div>
      {searching ? (
        <form className="rounded border p-3" onSubmit={(event) => { event.preventDefault(); setSearching(false); }}>
          <input autoFocus className="min-h-11 w-full rounded border px-3" aria-label="Quick search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
      ) : null}
      <AddContact onAdded={load} onError={setError} />
      {error ? <p>{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="text-xl">Contacts</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <button className="min-h-11 w-full rounded border px-3 text-left" type="button" onClick={() => setOpen(contact.id)}>
                  {contact.name} · {contact.company}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xl">Deals</h2>
          {STAGES.map((stage) => (
            <div key={stage} className="mt-3">
              <h3 className="capitalize">{stage}</h3>
              {data.deals.filter((deal) => deal.stage === stage).map((deal) => (
                <div key={deal.id} className="mt-1 flex items-center justify-between gap-2 rounded border px-3 py-2">
                  <span>{deal.title}</span>
                  <label className="text-sm">Move
                    <select className="ml-2 min-h-11" aria-label={`Move ${deal.title}`} value={deal.stage} onChange={async (event) => {
                      await api("PATCH", { method: "PATCH", path: `/deals/${deal.id}`, body: { stage: event.target.value } });
                      await load();
                    }}>
                      {STAGES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
      {selected ? <ContactCard contact={selected} deals={data.deals} activities={data.activities} onChanged={load} /> : null}
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return <article className="rounded border p-4"><h2 className="text-sm">{title}</h2><p className="text-2xl">{value}</p></article>;
}

function AddContact({ onAdded, onError }: { onAdded: () => Promise<void>; onError: (msg: string) => void }) {
  const [name, setName] = useState("");
  return (
    <form className="flex gap-2" onSubmit={async (event) => {
      event.preventDefault();
      const result = await api("PATCH", { method: "POST", path: "/contacts", body: { name, tags: [] } });
      if (!result.ok) onError(result.payload?.errors?.name ?? "Could not add");
      else { setName(""); await onAdded(); }
    }}>
      <input className="min-h-11 flex-1 rounded border px-3" aria-label="New contact name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New contact" />
      <button className="min-h-11 rounded border px-3" type="submit">Add</button>
    </form>
  );
}

function ContactCard({ contact, deals, activities, onChanged }: { contact: Contact; deals: Deal[]; activities: Activity[]; onChanged: () => Promise<void> }) {
  return (
    <section className="rounded border p-4">
      <h2 className="text-xl">{contact.name}</h2>
      <p>{contact.email} · {contact.phone} · {contact.company}</p>
      <h3 className="mt-3">Deals</h3>
      <ul>{deals.filter((deal) => deal.contactId === contact.id).map((deal) => <li key={deal.id}>{deal.title} · {deal.stage}</li>)}</ul>
      <h3 className="mt-3">Timeline</h3>
      <ul>{activities.filter((item) => item.contactId === contact.id).map((item) => <li key={item.id}>{item.kind}: {item.body}</li>)}</ul>
      <button className="mt-3 min-h-11 rounded border px-3" type="button" onClick={async () => {
        if (!window.confirm(`Delete ${contact.name}?`)) return;
        await api("PATCH", { method: "DELETE", path: `/contacts/${contact.id}` });
        await onChanged();
      }}>Delete contact</button>
    </section>
  );
}
