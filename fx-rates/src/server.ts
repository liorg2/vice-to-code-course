import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { createFrankfurterSource } from "./frankfurter.ts";
import { handleRequest } from "./handler.ts";
import { createMemoryKeys } from "./memory-store.ts";
import type { ApiKeyRecord } from "./types.ts";

const port = Number(process.env.PORT ?? 3000);

function loadKeys() {
  const file = process.env.KEYS_FILE ?? "data/keys.json";
  if (!existsSync(file)) return undefined;
  const parsed = JSON.parse(readFileSync(file, "utf8")) as ApiKeyRecord[];
  const store = createMemoryKeys();
  for (const record of parsed) void store.put(record);
  return store;
}

const keys = loadKeys();
const source = createFrankfurterSource();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const query: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  const headers: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key] = Array.isArray(value) ? value[0] : value;
  }
  const result = await handleRequest(
    { method: req.method ?? "GET", path: url.pathname, query, headers },
    { source, keys },
  );
  const body = result.status === 204 ? undefined : JSON.stringify(result.body);
  res.writeHead(result.status, result.headers);
  res.end(body);
});

server.listen(port, () => {
  console.log(`fx-rates listening on http://localhost:${port}`);
  if (!keys) console.log("API keys are off until you run npm run create-key");
});
