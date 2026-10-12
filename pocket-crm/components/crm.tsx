"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
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
      <Container size="xs" py={80}>
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Badge mb="sm">Practice contacts · Mantine</Badge>
          <Title order={1} mb="xs">Pocket CRM</Title>
          <Text c="dimmed" mb="lg">Nothing here is a real customer.</Text>
          <form onSubmit={signIn}>
            <Stack>
              <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
              <TextInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
              <Button type="submit">Sign in</Button>
              {error ? <Text c="red">{error}</Text> : null}
            </Stack>
          </form>
          <Text size="sm" c="dimmed" mt="md">a@example.test / crm-a · b@example.test / crm-b</Text>
        </Card>
      </Container>
    );
  }

  const openDeals = data.deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
  const won = data.deals.filter((deal) => deal.stage === "won").reduce((sum, deal) => sum + deal.valueCents, 0);
  const tasks = data.activities.filter((item) => item.kind === "task" && !item.done);
  const selected = data.contacts.find((contact) => contact.id === open);

  return (
    <Container size="xl" py="xl">
      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Title order={1}>Pocket CRM</Title>
              <Text size="sm" c="dimmed" mt={4}>
                Signed in as {data.me.name}.{" "}
                {process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? "Supabase is connected."
                  : "Local practice file until Supabase env vars exist."}
              </Text>
            </div>
            <Button
              variant="light"
              onClick={async () => {
                await api("DELETE");
                setData(null);
              }}
            >
              Sign out
            </Button>
          </Group>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Stat title="Open deals" value={`$${(openDeals.reduce((s, d) => s + d.valueCents, 0) / 100).toLocaleString()}`} />
          <Stat title="Won" value={`$${(won / 100).toLocaleString()}`} />
          <Stat title="Open tasks" value={String(tasks.length)} />
        </SimpleGrid>

        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group>
            <TextInput style={{ flex: 1 }} placeholder="Search contacts" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
            <TextInput placeholder="Tag" value={tag} onChange={(e) => setTag(e.currentTarget.value)} />
            <Button variant="default" onClick={() => setSearching(true)}>Search (Ctrl+K)</Button>
          </Group>
        </Card>

        {searching ? (
          <Card withBorder padding="md" radius="md">
            <TextInput autoFocus label="Quick search" value={query} onChange={(e) => setQuery(e.currentTarget.value)} onKeyDown={(e) => e.key === "Enter" && setSearching(false)} />
          </Card>
        ) : null}

        <AddContact onAdded={load} onError={setError} />
        {error ? <Text c="red">{error}</Text> : null}

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Title order={3} mb="md">Contacts</Title>
              <Stack gap="xs">
                {contacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant={open === contact.id ? "filled" : "light"}
                    justify="flex-start"
                    onClick={() => setOpen(contact.id)}
                  >
                    {contact.name} · {contact.company}
                  </Button>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={3} mb="md">Deals</Title>
              {STAGES.map((stage) => (
                <div key={stage}>
                  <Badge mb="xs" mt="sm" tt="capitalize">{stage}</Badge>
                  {data.deals
                    .filter((deal) => deal.stage === stage)
                    .map((deal) => (
                      <Group key={deal.id} justify="space-between" mb="xs" p="xs" style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: 8 }}>
                        <Text size="sm">{deal.title}</Text>
                        <Select
                          size="xs"
                          w={140}
                          aria-label={`Move ${deal.title}`}
                          data={STAGES}
                          value={deal.stage}
                          onChange={async (value) => {
                            if (!value) return;
                            await api("PATCH", { method: "PATCH", path: `/deals/${deal.id}`, body: { stage: value } });
                            await load();
                          }}
                        />
                      </Group>
                    ))}
                </div>
              ))}
            </Card>
          </Grid.Col>
        </Grid>

        {selected ? <ContactCard contact={selected} deals={data.deals} activities={data.activities} onChanged={load} /> : null}
      </Stack>
    </Container>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text size="sm" c="dimmed">{title}</Text>
      <Title order={2}>{value}</Title>
    </Card>
  );
}

function AddContact({ onAdded, onError }: { onAdded: () => Promise<void>; onError: (msg: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Group align="flex-end">
        <TextInput
          style={{ flex: 1 }}
          label="New contact"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Name"
        />
        <Button
          onClick={async () => {
            const result = await api("PATCH", { method: "POST", path: "/contacts", body: { name, tags: [] } });
            if (!result.ok) onError(result.payload?.errors?.name ?? "Could not add");
            else {
              setName("");
              await onAdded();
            }
          }}
        >
          Add
        </Button>
      </Group>
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
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3}>{contact.name}</Title>
      <Text c="dimmed" size="sm" mb="md">
        {contact.email} · {contact.phone} · {contact.company}
      </Text>
      <Text fw={600} size="sm">Deals</Text>
      {deals.filter((deal) => deal.contactId === contact.id).map((deal) => (
        <Text key={deal.id} size="sm" c="dimmed">{deal.title} · {deal.stage}</Text>
      ))}
      <Text fw={600} size="sm" mt="md">Timeline</Text>
      {activities.filter((item) => item.contactId === contact.id).map((item) => (
        <Text key={item.id} size="sm" c="dimmed">{item.kind}: {item.body}</Text>
      ))}
      <Button
        color="red"
        variant="light"
        mt="md"
        onClick={async () => {
          if (!window.confirm(`Delete ${contact.name}?`)) return;
          await api("PATCH", { method: "DELETE", path: `/contacts/${contact.id}` });
          await onChanged();
        }}
      >
        Delete contact
      </Button>
    </Card>
  );
}
