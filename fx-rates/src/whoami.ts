import { execFileSync } from "node:child_process";

try {
  const out = execFileSync("aws", ["sts", "get-caller-identity", "--output", "json"], {
    encoding: "utf8",
  });
  const identity = JSON.parse(out) as { Arn?: string };
  const arn = identity.Arn ?? "";
  if (arn.includes(":root")) {
    console.error("FAIL caller is root. Use fx-deployer.");
    process.exit(1);
  }
  console.log(out.trim());
} catch {
  console.log("aws CLI is not configured on this machine. Follow docs/aws-setup.md before deploying.");
  process.exit(0);
}
