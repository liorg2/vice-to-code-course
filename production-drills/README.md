# Production drills

These drills run on an app you already have. This folder is a worked example aimed at `nest-egg`, using the fake household only. Do not point them at a live database.

1. Map the app, its environments, and the main risks. Owner and first response for each risk. Use a staging copy for the rest.
2. Two test accounts see only their own rows. In Nest Egg that is `a@example.test` and `b@example.test`. List any secret-handling gaps.
3. Write down the services, their limits, alerts, and renewal dates, with a simple monthly cost. Each thing that can run out gets an owner.
4. A staging release checklist, preview checks, and a code rollback. Code rollback is not the same as restoring data.
5. Watch the main path in staging with fake data. Note the logs, error reports, and who gets alerts.
6. Restore a staging backup into a temporary database, count the rows, and write the steps.
7. An incident runbook: how you judge impact, what you tell people, and how you use the restore you already tested. No live user is affected.
8. Walk a launch checklist in staging, then a one-page handover a teammate can follow. They ask before any production action.

Nest Egg's local file is `nest-egg/data/practice.json`. Tests never open it.
