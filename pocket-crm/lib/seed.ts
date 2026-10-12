import type { Db } from "./model";

const companies = ["Northwind", "Lumen", "Harbor", "Fieldnote", "Kindling"];
const tags = ["design", "retainer", "warm", "referral"];

export function seed(): Db {
  const contacts = Array.from({ length: 12 }, (_, index) => ({
    id: `c-${index + 1}`,
    userId: "user-a",
    name: ["Mina Cole", "Jonah Park", "Leah Ortiz", "Samir Shah", "Nora Blake", "Evan Cho", "Priya Nair", "Chris Adeyemi", "Helen Wu", "Omar Farouk", "Greta Holm", "Luis Romero"][index]!,
    email: `person${index + 1}@example.test`,
    phone: `555-010${index}`,
    company: companies[index % companies.length]!,
    tags: [tags[index % tags.length]!],
  }));
  const other = { id: "c-b", userId: "user-b", name: "Blair's client", email: "blair.client@example.test", phone: "", company: "Other", tags: ["private"] };
  const deals = contacts.slice(0, 8).map((contact, index) => ({
    id: `d-${index + 1}`,
    userId: "user-a",
    title: `${contact.company} project`,
    contactId: contact.id,
    valueCents: (index + 2) * 150000,
    stage: (["lead", "qualified", "proposal", "won", "lost"] as const)[index % 5],
  }));
  const activities = contacts.slice(0, 6).map((contact, index) => ({
    id: `act-${index + 1}`,
    userId: "user-a",
    contactId: contact.id,
    kind: (["note", "call", "meeting", "email", "task"] as const)[index % 5],
    body: index === 0 ? "Send the proposal" : `Follow up with ${contact.name}`,
    done: index % 4 === 0,
  }));
  return {
    users: [
      { id: "user-a", email: "a@example.test", password: "crm-a", name: "Avery" },
      { id: "user-b", email: "b@example.test", password: "crm-b", name: "Blair" },
    ],
    contacts: [...contacts, other],
    deals,
    activities,
  };
}
