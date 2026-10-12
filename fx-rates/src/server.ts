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

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Forex Rates</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Fraunces:wght@600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --background: #f3f6f8; --foreground: #15202b; --card: #ffffff; --primary: #0f766e;
      --muted: #5b6b7c; --border: #d5dee6; --accent: #dff3ef; --radius: 0.875rem;
      --shadow: 0 10px 30px rgba(21, 32, 43, 0.06);
      --shell: radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 34%),
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 28%),
        linear-gradient(180deg, #f7fafb 0%, #eef3f6 100%);
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: "DM Sans", sans-serif; color: var(--foreground); background: var(--shell); }
    main { max-width: 40rem; margin: 10vh auto; padding: 1.5rem; background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow); }
    .badge { display: inline-flex; border-radius: 999px; background: var(--accent); color: var(--primary);
      padding: 0.25rem 0.7rem; font-size: 0.75rem; font-weight: 700; }
    h1 { margin: 0.75rem 0 0.35rem; font-family: Fraunces, Georgia, serif; font-size: 2rem; letter-spacing: -0.02em; }
    p { color: var(--muted); line-height: 1.5; }
    a { display: block; margin: 0.6rem 0; padding: 0.85rem 1rem; border-radius: calc(var(--radius) - 4px);
      background: var(--primary); color: #f4fffd; text-decoration: none; font-weight: 700; }
    a.secondary { background: #e8eef2; color: var(--foreground); }
    code { background: #e8eef2; padding: 0.15rem 0.45rem; border-radius: 0.4rem; color: var(--foreground); }
  </style>
</head>
<body>
  <main>
    <span class="badge">Lab design system</span>
    <h1>Forex Rates</h1>
    <p>A small public exchange-rate API. Try a live call:</p>
    <a href="/v1/rates?base=USD&amp;symbols=EUR,ILS">USD to EUR and ILS</a>
    <a class="secondary" href="/v1/convert?from=USD&amp;to=ILS&amp;amount=100">Convert 100 USD to ILS</a>
    <p>Health: <code>/v1/health</code></p>
  </main>
</body>
</html>`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if ((req.method ?? "GET") === "GET" && (url.pathname === "/" || url.pathname === "")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(page);
    return;
  }
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
