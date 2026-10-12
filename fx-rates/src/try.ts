import { createFrankfurterSource } from "./frankfurter.ts";

const source = createFrankfurterSource();
const doc = await source("USD", ["EUR", "ILS"]);
console.log(JSON.stringify({ base: doc.base, date: doc.date, rates: doc.rates }, null, 2));
