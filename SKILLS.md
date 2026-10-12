# Free skills

This folder holds skills used by the labs:

| Path | What it is |
| --- | --- |
| [`agent-skills/`](./agent-skills/) | Free open-source pack by [Addy Osmani](https://github.com/addyosmani/agent-skills) (MIT). Spec, plan, TDD, security, deploy, and more. Required by the Forex API lab. |
| [`skills/lab-check/`](./skills/lab-check/) | End-of-step checker for Nest Egg and the other app labs (`/lab-check`). |

Upstream source for the pack: https://github.com/addyosmani/agent-skills

## Install in Claude Code

### Option A — marketplace (recommended for the pack)

In Claude Code chat, one command at a time, then restart Claude Code:

```text
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

If SSH fails, use HTTPS:

```text
/plugin marketplace add https://github.com/addyosmani/agent-skills.git
/plugin install agent-skills@addy-agent-skills
```

Or point at the copy in this repo:

```bash
claude --plugin-dir ./agent-skills
```

Check with `/plugin`. Type `/` and you should see commands such as `/spec` and `/plan`.

### Option B — personal `lab-check` skill

Copy this repo's lab-check skill into your user skills folder:

```bash
# macOS / Linux
mkdir -p ~/.claude/skills
cp -R skills/lab-check ~/.claude/skills/

# Windows (PowerShell)
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
Copy-Item -Recurse skills\lab-check "$env:USERPROFILE\.claude\skills\"
```

Then type `/lab-check` at the end of a lab step (or say `run the lab-check routine`).

## Install in Cursor

1. From this repo root, sync the pack into the project Cursor skills folder:

```bash
# macOS / Linux
mkdir -p .cursor/skills
cp -R agent-skills/skills/* .cursor/skills/

# Windows (PowerShell)
New-Item -ItemType Directory -Force .cursor\skills | Out-Null
Copy-Item -Recurse agent-skills\skills\* .cursor\skills\
```

2. Copy `lab-check` the same way:

```bash
cp -R skills/lab-check .cursor/skills/
# Windows: Copy-Item -Recurse skills\lab-check .cursor\skills\
```

3. Or install with the skills CLI (any agent):

```bash
npx skills add addyosmani/agent-skills
```

4. When a lab prompt names a skill, Cursor can load it from `.cursor/skills/`. You can also start a message with:

```text
Read agent-skills/skills/test-driven-development/SKILL.md and follow it for this step.
```

Do not paste full skill files into Cursor rules; keep short policies in `.cursor/rules/` and full workflows under `.cursor/skills/`.

## Install in Codex

Codex CLI v0.122+:

```bash
codex plugin marketplace add addyosmani/agent-skills
codex plugin add agent-skills@agent-skills
```

To use the copy vendored in this repo, follow [agent-skills/docs/codex-setup.md](./agent-skills/docs/codex-setup.md) for a local plugin path.

In chat, invoke a skill with `@`, for example `@spec-driven-development`.

For `lab-check`, copy `skills/lab-check` into Codex's personal skills folder (see your Codex docs for the current path), or paste:

```text
Read skills/lab-check/SKILL.md and run the lab-check routine.
```

## Any agent (skills CLI)

```bash
npx skills add addyosmani/agent-skills
npx skills add addyosmani/agent-skills --list
npx skills add addyosmani/agent-skills --skill test-driven-development
```

## Using them with the labs

- **Nest Egg / Pocket CRM / Pocket Rates:** install `lab-check`, then finish each step with `/lab-check` or `run the lab-check routine`.
- **Forex API (`fx-rates`):** each step prompt names an `agent-skills` skill (for example `spec-driven-development`). With the pack installed, paste the step prompt. Without a plugin, start with `Read ../agent-skills/skills/<name>/SKILL.md and follow it` (or `agent-skills/skills/...` from the repo root).

## License

`agent-skills/` is MIT © Addy Osmani (see `agent-skills/LICENSE`). `skills/lab-check/` is part of this course repo.
