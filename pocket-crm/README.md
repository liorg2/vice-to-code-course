# Pocket CRM

A freelancer's contacts, deals, and activities. Practice data only.

```bash
npm install
npm run check
npm run dev
```

Sign in as `a@example.test` / `crm-a`. `b@example.test` / `crm-b` has a different contact and cannot see Avery's.

Without Supabase env vars the app stores rows in `data/practice.json`. The SQL in `supabase/migrations` is what you paste into a Supabase project when you want the hosted database and row level security. Set `NEXT_PUBLIC_SUPABASE_URL` only after that project exists. The anon key is public. The service role key never goes in this app.
