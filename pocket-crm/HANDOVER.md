# Handover

Pocket CRM is the Next.js app in this folder.

- Code: this folder, in the vice-to-code-course repository.
- Running copy: your own Vercel project, if you import the repo and set the two public Supabase values. Do not set the secret key.
- Database: your Supabase project, after you run `supabase/migrations/001_init.sql` and `002_rls.sql`.

Keys: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public and may live in the host's env settings. The service role key skips every privacy rule. It never goes in the app or in chat.

Privacy check: sign in as B. A's contacts do not show.

Free plan: Supabase pauses a free project after inactivity. The app then fails to load rows. In the Supabase dashboard, open the project and restore it. Check the current Supabase docs for the exact button, because the label changes.

Not done: a custom domain, sending email, and taking payment.
