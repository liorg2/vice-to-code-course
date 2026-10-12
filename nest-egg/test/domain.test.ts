import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AccountType } from "../lib/model";
import { formatUSD } from "../lib/money";
import { ageInYear, netWorthCents, project } from "../lib/project";
import { seedState } from "../lib/seed";
import { login, mutate, passwordOk } from "../lib/store";
import { validateAccount, validatePerson, validatePlan, validateSnapshot } from "../lib/validate";

const bad = "yacht";
// @ts-expect-error unknown account type
const typed: AccountType = bad;
void typed;

describe("money and records", () => {
  it("formats cents", () => {
    assert.equal(formatUSD(123456), "$1,234.56");
    assert.equal(formatUSD(-500), "-$5.00");
  });

  it("rejects invalid records", () => {
    assert.equal(validatePerson({ name: "", birthYear: 1980 }, "1").ok, false);
    assert.equal(validatePerson({ name: "x".repeat(101), birthYear: 1980 }, "1").ok, false);
    assert.equal(validatePerson({ name: "Alex", birthYear: 2999 }, "1").ok, false);
    assert.equal(validateAccount({ name: "Cash", type: "yacht", ownerId: "p" }, "1", []).ok, false);
    assert.equal(validateSnapshot({ accountId: "a", month: "2026-13", balanceCents: 1.5 }, "1", [{ id: "a", name: "Cash", type: "cash", ownerId: "p" }]).ok, false);
    assert.equal(validatePlan({ name: "P", monthlySavingCents: 1, monthlySpendCents: 1, yearlyReturnPercent: 50, yearlyInflationPercent: 0, retirementAges: {} }, "1").ok, false);
  });
});

describe("projection", () => {
  it("adds exactly $12,000 after 12 months at zero return", () => {
    const person = { id: "p", name: "Alex", birthYear: 1980 };
    const rows = project(
      { people: [person], accounts: [], snapshots: [] },
      {
        id: "plan",
        name: "Save",
        retirementAges: { p: 90 },
        monthlySavingCents: 100000,
        monthlySpendCents: 0,
        yearlyReturnPercent: 0,
        yearlyInflationPercent: 0,
        events: [],
      },
      12 * 20,
      "2026-01",
    );
    assert.equal(rows[11]?.netWorthCents, 1_200_000);
    assert.equal(ageInYear(person, 2040), 60);
    assert.ok(rows.filter((row) => row.date.startsWith("2040")).every((row) => row.ages.p === 60));
  });
});

describe("api rules", () => {
  it("creates, rejects, conflicts and isolates households", () => {
    const state = seedState();
    const owner = login(state, "a@example.test", "nest-a");
    const other = login(state, "b@example.test", "nest-b");
    const viewer = login(state, "c@example.test", "nest-c");
    assert.ok(owner && other && viewer);
    assert.equal(passwordOk(owner, "nest-a"), true);

    const created = mutate(state, owner.householdId, owner.role, "POST", "/accounts", {
      name: "Vacation fund",
      type: "cash",
      ownerId: "p-alex",
    });
    assert.equal(created.status, 201);
    const accountId = (created.body as { id: string }).id;

    const blank = mutate(state, owner.householdId, owner.role, "POST", "/people", { name: "", birthYear: 1980 });
    assert.equal(blank.status, 400);
    assert.ok((blank.body as { errors: { name: string } }).errors.name);

    const snap = mutate(state, owner.householdId, owner.role, "POST", "/snapshots", {
      accountId,
      month: "2026-10",
      balanceCents: 5000,
    });
    assert.equal(snap.status, 201);
    const again = mutate(state, owner.householdId, owner.role, "POST", "/snapshots", {
      accountId,
      month: "2026-10",
      balanceCents: 6000,
    });
    assert.equal(again.status, 409);
    const missing = mutate(state, owner.householdId, owner.role, "POST", "/snapshots", {
      accountId: "missing",
      month: "2026-11",
      balanceCents: 100,
    });
    assert.equal(missing.status, 422);

    const removed = mutate(state, owner.householdId, owner.role, "DELETE", `/accounts/${accountId}`, {});
    assert.equal(removed.status, 204);
    const gone = mutate(state, owner.householdId, owner.role, "PATCH", `/accounts/${accountId}`, { name: "Nope" });
    assert.equal(gone.status, 404);

    const home = state.households.find((item) => item.id === owner.householdId)!;
    const worth = netWorthCents(home.accounts, home.snapshots);
    const reported = mutate(state, owner.householdId, owner.role, "GET", "/net-worth", {});
    assert.equal((reported.body as { totalCents: number }).totalCents, worth);

    const denied = mutate(state, viewer.householdId, viewer.role, "POST", "/accounts", {
      name: "Nope",
      type: "cash",
      ownerId: "p-alex",
    });
    assert.equal(denied.status, 403);
    const otherList = mutate(state, other.householdId, other.role, "GET", "/accounts", {});
    const names = (otherList.body as { items: { name: string }[] }).items.map((item) => item.name);
    assert.deepEqual(names, ["Blair cash"]);
  });
});
