import { execFileSync } from "node:child_process";

try {
  execFileSync("sam", ["--version"], { stdio: "inherit" });
  execFileSync("sam", ["validate", "--lint"], { stdio: "inherit" });
} catch (error) {
  const err = error as { status?: number; code?: string };
  if (err.code === "ENOENT") {
    console.log("sam is not installed; skipped template validation");
    process.exit(0);
  }
  process.exit(err.status ?? 1);
}
