---
name: lab-check
description: End-of-step routine for Vice to Code labs. Use when the user types /lab-check or says "run the lab-check routine" after a lab step.
---

# Lab check

1. If there is no `package.json`, say "no project yet" and stop.
2. Read `AGENTS.md` and `STEPS.md` if they exist.
3. Run `npm run check` and report the real result.
4. Review `git diff` for changes unrelated to the step.
5. Report a plain-English table of what changed and what passed.
6. Add one line to `STEPS.md` about this step.

Do not change application code to hide a failure. Report PASS or FAIL with evidence.
