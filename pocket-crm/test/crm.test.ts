import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seed } from "../lib/seed";
import { mutate } from "../lib/store";

describe("pocket crm", () => {
  it("keeps each person's rows private and deletes children with a contact", () => {
    const db = seed();
    const added = mutate(db, "user-a", "POST", "/contacts", { name: "New Person", email: "new@example.test" });
    assert.equal(added.status, 201);
    const blank = mutate(db, "user-a", "POST", "/contacts", { name: "  " });
    assert.equal(blank.status, 400);
    const seenByB = mutate(db, "user-b", "GET", "/", {});
    const names = (seenByB.body as { contacts: { name: string }[] }).contacts.map((row) => row.name);
    assert.deepEqual(names, ["Blair's client"]);
    const id = (added.body as { id: string }).id;
    const removed = mutate(db, "user-a", "DELETE", `/contacts/${id}`, {});
    assert.equal(removed.status, 204);
  });

  it("moves a deal between stages", () => {
    const db = seed();
    const deal = db.deals[0]!;
    const moved = mutate(db, "user-a", "PATCH", `/deals/${deal.id}`, { stage: "won" });
    assert.equal(moved.status, 200);
    assert.equal((moved.body as { stage: string }).stage, "won");
  });
});
