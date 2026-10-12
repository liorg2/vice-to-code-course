-- Pocket CRM practice schema. Paste into the Supabase SQL editor.
-- Row level security is intentionally off until 002_rls.sql.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text,
  phone text,
  company text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  contact_id uuid not null references contacts(id) on delete cascade,
  title text not null,
  value_cents integer not null,
  stage text not null check (stage in ('lead', 'qualified', 'proposal', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  contact_id uuid not null references contacts(id) on delete cascade,
  kind text not null check (kind in ('note', 'call', 'meeting', 'email', 'task')),
  body text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contacts_search on contacts using gin (to_tsvector('simple', name || ' ' || coalesce(company, '')));
create index if not exists contacts_user on contacts (user_id);
create index if not exists deals_user on deals (user_id);
create index if not exists activities_user on activities (user_id);
