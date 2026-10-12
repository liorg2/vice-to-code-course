"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Activity, Contact, Deal, Stage } from "@/lib/model";
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
  Select,
  Shell,
} from "@/components/ds";

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
  return {
    ok: response.ok,
    status: response.status,
    payload: text ? (JSON.parse(text) as Payload & { error?: string; errors?: Record<string, string> }) : null,
  };
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
      <Shell>
        <Page className="max-w-md justify-center py-16">
          <Card>
            <CardHeader>
              <Badge>Practice contacts</Badge>
              <CardTitle className="text-3xl">Pocket CRM</CardTitle>
              <CardDescription>Nothing here is a real customer.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={signIn} className="flex flex-col gap-3">
                <Field label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
                </Field>
                <Field label="Password">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
                </Field>
                <Button type="submit">Sign in</Button>
                {error ? <p className="text-sm text-[var(--destructive)]">{error}</p> : null}
              </form>
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                a@example.test / crm-a · b@example.test / crm-b
              </p>
            </CardContent>
          </Card>
        </Page>
      </Shell>
    );
  }

  const openDeals = data.deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
  const won = data.deals.filter((deal) => deal.stage === "won").reduce((sum, deal) => sum + deal.valueCents, 0);
  const tasks = data.activities.filter((item) => item.kind === "task" && !item.done);
  const selected = data.contacts.find((contact) => contact.id === open);

  return (
    <Shell>
      <Page className="max-w-6xl">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">Pocket CRM</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Signed in as {data.me.name}.{" "}
                {process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? "Supabase is connected."
                  : "Local practice file until Supabase env vars exist."}
              </p>
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={async () => {
                await api("DELETE");
                setData(null);
              }}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat title="Open deals" value={`$${(openDeals.reduce((s, d) => s + d.valueCents, 0) / 100).toLocaleString()}`} />
          <Stat title="Won" value={`$${(won / 100).toLocaleString()}`} />
          <Stat title="Open tasks" value={String(tasks.length)} />
        </section>

        <Card>
          <CardContent className="flex flex-wrap gap-2 py-4">
            <Input
              className="min-w-[12rem] flex-1"
              placeholder="Search contacts"
              aria-label="Search contacts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Input placeholder="Tag" aria-label="Tag filter" value={tag} onChange={(e) => setTag(e.target.value)} />
            <Button variant="outline" type="button" onClick={() => setSearching(true)}>
              Search (Ctrl+K)
            </Button>
          </CardContent>
        </Card>

        {searching ? (
          <Card>
            <CardContent className="py-4">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearching(false);
                }}
              >
                <Input autoFocus aria-label="Quick search" value={query} onChange={(e) => setQuery(e.target.value)} />
              </form>
            </CardContent>
          </Card>
        ) : null}

        <AddContact onAdded={load} onError={setError} />
        {error ? <p className="text-sm text-[var(--destructive)]">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {contacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant={open === contact.id ? "default" : "outline"}
                  className="justify-start"
                  type="button"
                  onClick={() => setOpen(contact.id)}
                >
                  {contact.name} · {contact.company}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deals</CardTitle>
            </CardHeader>
            <CardContent>
              {STAGES.map((stage) => (
                <div key={stage} className="mt-3 first:mt-0">
                  <Badge className="mb-2 capitalize">{stage}</Badge>
                  {data.deals
                    .filter((deal) => deal.stage === stage)
                    .map((deal) => (
                      <div
                        key={deal.id}
                        className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[calc(var(--radius)-4px)] border border-[var(--border)] px-3 py-2"
                      >
                        <span className="text-sm">{deal.title}</span>
                        <Select
                          aria-label={`Move ${deal.title}`}
                          value={deal.stage}
                          onChange={async (event) => {
                            await api("PATCH", {
                              method: "PATCH",
                              path: `/deals/${deal.id}`,
                              body: { stage: event.target.value },
                            });
                            await load();
                          }}
                        >
                          {STAGES.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </Select>
                      </div>
                    ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {selected ? <ContactCard contact={selected} deals={data.deals} activities={data.activities} onChanged={load} /> : null}
      </Page>
    </Shell>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-[var(--muted-foreground)]">{title}</p>
        <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function AddContact({ onAdded, onError }: { onAdded: () => Promise<void>; onError: (msg: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Card>
      <CardContent className="py-4">
        <form
          className="flex gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await api("PATCH", { method: "POST", path: "/contacts", body: { name, tags: [] } });
            if (!result.ok) onError(result.payload?.errors?.name ?? "Could not add");
            else {
              setName("");
              await onAdded();
            }
          }}
        >
          <Input aria-label="New contact name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New contact" />
          <Button type="submit">Add</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ContactCard({
  contact,
  deals,
  activities,
  onChanged,
}: {
  contact: Contact;
  deals: Deal[];
  activities: Activity[];
  onChanged: () => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{contact.name}</CardTitle>
        <CardDescription>
          {contact.email} · {contact.phone} · {contact.company}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-1 text-sm font-semibold">Deals</h3>
          <ul className="text-sm text-[var(--muted-foreground)]">
            {deals
              .filter((deal) => deal.contactId === contact.id)
              .map((deal) => (
                <li key={deal.id}>
                  {deal.title} · {deal.stage}
                </li>
              ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold">Timeline</h3>
          <ul className="text-sm text-[var(--muted-foreground)]">
            {activities
              .filter((item) => item.contactId === contact.id)
              .map((item) => (
                <li key={item.id}>
                  {item.kind}: {item.body}
                </li>
              ))}
          </ul>
        </div>
        <Button
          variant="destructive"
          type="button"
          onClick={async () => {
            if (!window.confirm(`Delete ${contact.name}?`)) return;
            await api("PATCH", { method: "DELETE", path: `/contacts/${contact.id}` });
            await onChanged();
          }}
        >
          Delete contact
        </Button>
      </CardContent>
    </Card>
  );
}
