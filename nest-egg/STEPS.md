# Progress

- ground: Next.js app, typed records, validators, projection, formatUSD.
- vcs: git history lives in the course repository that contains this folder.
- sides: `/api/health` returns status and a timestamp and is shown on the home screen.
- frontend: today, snapshot, retire, compare, and kids screens.
- data: practice file plus in-memory tests. Status codes 201, 400, 404, 409, 422, 204.
- security: sign-in, household ownership, viewer cannot write.
- pay: `POST /api/billing` with an HMAC signature turns Pro on. Sending the same event id twice does nothing.
- mobile: manifest and 44px controls. Add to Home Screen needs HTTPS.

Sample Pro event, signed with `lab-billing-secret`:

```json
{"id":"evt_demo","type":"paid"}
```
