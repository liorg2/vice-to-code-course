# ADR 0001: API keys inside the HTTP API

API Gateway usage plans and API keys belong to REST APIs, not to HTTP APIs. We keep the HTTP API and check `x-api-key` in the function. Hashes and daily counters live in the same DynamoDB table as the rates (partition key `pk`). Stage throttling stays as a global safety net.

The local server uses the same rule with `data/keys.json` when that file exists.
