# Forex Rates API

## Endpoints

- `GET /v1/health` → `{ "status": "ok" }`. No key.
- `GET /v1/rates?base=USD&symbols=EUR,ILS` → `base`, `date`, `rates`, `stale`.
- `GET /v1/convert?from=USD&to=ILS&amount=100` → `from`, `to`, `amount`, `rate`, `result`, `date`.

Currency codes are three capital letters. `symbols` is a comma list of at most 10 codes. `amount` is a positive number below one billion. Unknown query names are rejected.

## Data source

Frankfurter v1, `https://api.frankfurter.dev/v1/latest`. No API key. The response is `{ amount, base, date, rates }`.

## Cache

Callers read a stored document per base currency. A refresh job writes it. `stale` is true when `fetchedAt` is older than 36 hours. The document is kept (DynamoDB TTL of 7 days) so a stale answer is still an answer.

## Keys

Optional locally. When `data/keys.json` exists, `/v1/rates` and `/v1/convert` require `x-api-key`. Only the SHA-256 hash is stored. Each key has a daily quota. Over the quota: 429 and `Retry-After`.

## Rounding

`result` is rounded half away from zero to 2 decimal places. See `src/round.ts`.

## Errors

`{ "error": { "code": "...", "message": "..." } }`

- 400 bad input
- 401 missing or unknown key
- 404 unknown path or unknown symbol
- 405 wrong method
- 429 over quota
- 502 upstream failed and nothing is cached

## Out of scope

Historical rates, webhooks, a paid plan, and any database other than the rates cache and key hashes.
