# Vice to Code labs

Finished practice projects from the course, one folder each. They use fake data only.

| Folder | Lab |
| --- | --- |
| `pocket-crm` | Pocket CRM. Runs locally without Supabase. SQL for Supabase is in `supabase/migrations`. |
| `nest-egg` | Nest Egg, the household net worth planner. |
| `pocket-rates` | Pocket Rates, the Expo currency app. |
| `fx-rates` | Forex Rates API. Runs locally. `template.yaml` is the AWS stack, and nothing deploys until you approve it. |
| `production-drills` | The eight production drills, written against Nest Egg's practice data. |

Each app has its own `npm install` and `npm run check`. You can run one app on your machine, or start the set with Docker.

## Agent skills

Course skills (including `lab-check`) live in [liorg2/vibe-to-code-skills](https://github.com/liorg2/vibe-to-code-skills) on `main`. Copy `lab-check/SKILL.md` into your agent's skills folder, or install from that repo.

For a broader free engineering pack: `npx skills add addyosmani/agent-skills`.

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
