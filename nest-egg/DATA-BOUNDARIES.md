# Data boundaries

Practice data only. Never real customers, balances, or production credentials.

## Local

The file `data/practice.json` on this computer. Created on first run from the sample household. One process should write it at a time.

## Test

`npm run check` builds its own in-memory database and never reads `data/practice.json`.

## Preview

A separate database, if you later deploy a preview. It must not be the local file and must not be the live database. This repo does not connect one.

## Live

Not used. The app refuses to start when `DATA_BOUNDARY` is `live` or `preview`.
