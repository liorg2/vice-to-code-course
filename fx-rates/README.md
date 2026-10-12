# Forex Rates API

A small public exchange-rate API. It runs on your computer with no cloud account, and `template.yaml` is the AWS staging stack for when you choose to deploy it.

## Run locally

```bash
npm install
npm run check
npm start
```

Then, in another terminal:

```bash
curl "http://localhost:3000/v1/rates?base=USD&symbols=EUR,ILS"
curl "http://localhost:3000/v1/convert?from=USD&to=ILS&amount=100"
npm run try
```

`npm run try` prints today's EUR and ILS rates from Frankfurter. On a weekend that date is the previous Friday.

## API keys

Keys are off until you create one. The file stores a SHA-256 hash, and the command prints the key once.

```bash
npm run create-key -- lab 100
npm run disable-key -- lab
```

Restart `npm start` after creating a key. Send it as `x-api-key`.

## AWS

Do not deploy until you have followed `docs/aws-setup.md` and approved the cost. Teardown is one command, documented in `docs/deploy.md`.
