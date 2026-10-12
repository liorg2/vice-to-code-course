export const STAGES = ["lead", "qualified", "proposal", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];
export type ActivityKind = "note" | "call" | "meeting" | "email" | "task";

export type Contact = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
};
export type Deal = {
  id: string;
  userId: string;
  title: string;
  contactId: string;
  valueCents: number;
  stage: Stage;
};
export type Activity = {
  id: string;
  userId: string;
  contactId: string;
  kind: ActivityKind;
  body: string;
  done: boolean;
};

export type User = { id: string; email: string; password: string; name: string };
export type Db = { users: User[]; contacts: Contact[]; deals: Deal[]; activities: Activity[] };
