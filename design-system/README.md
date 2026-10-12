# Lab design system

Shared tokens and UI primitives for the Next.js labs.

- `tokens.css` — CSS variables for light/dark and brand accents (`data-brand="crm"`)
- `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx` — CVA + Tailwind primitives
- Copied into `nest-egg/components/ds` and `pocket-crm/components/ds` so each app can build alone

Primary brand is teal. Pocket CRM flips to sky via `data-brand="crm"` on `<html>`.
