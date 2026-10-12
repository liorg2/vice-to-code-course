# Vice to Code labs

Finished practice projects from the course, one folder each. They use fake data only.

| Folder | Lab |
| --- | --- |
| `pocket-crm` | Pocket CRM. Runs locally without Supabase. SQL for Supabase is in `supabase/migrations`. |
| `nest-egg` | Nest Egg, the household net worth planner. |
| `pocket-rates` | Pocket Rates, the Expo currency app. |
| `fx-rates` | Forex Rates API. Runs locally. `template.yaml` is the AWS stack, and nothing deploys until you approve it. |
| `production-drills` | The eight production drills, written against Nest Egg's practice data. |
| `agent-skills/` | Free engineering skills pack (Addy Osmani), used by the Forex lab. |
| `skills/lab-check/` | End-of-step `/lab-check` skill for the app labs. |

Each app has its own `npm install` and `npm run check`. You can run one app on your machine, or start the set with Docker.

## Free skills (Claude, Cursor, Codex)

See **[SKILLS.md](./SKILLS.md)** for install steps in Claude Code, Cursor, and Codex. Short version:

```bash
# any agent
npx skills add addyosmani/agent-skills

# or use the copy in this repo (Claude Code)
claude --plugin-dir ./agent-skills
```

## On your machine

```bash
cd nest-egg && npm install && npm run dev
```

Same pattern in `pocket-crm` (port 3000 unless you pass `-p`), `fx-rates` (`npm start`), and `pocket-rates` (`npx expo start`).

## Docker

From this folder, with Docker running:

```bash
docker compose up --build
```

| App | URL |
| --- | --- |
| Nest Egg | http://localhost:3000 |
| Pocket CRM | http://localhost:3001 |
| Forex API | http://localhost:3002/v1/health |
| Pocket Rates (web) | http://localhost:8081 |

Nest Egg and Pocket CRM keep their practice files in Docker volumes, so a restart does not wipe the fake households. Pocket Rates in Docker is the web preview. Expo Go on a phone still uses `npx expo start` on your machine.
