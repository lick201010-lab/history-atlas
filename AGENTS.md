# Agent Startup Protocol

This project is building the final complete version of History Atlas. The deployed `v0.1.0` site is only an online milestone. It is not the final product.

Every Codex, Claude, or other agent must follow this startup protocol before changing files.

## Required Context Read

Before any implementation, read:

1. `docs/FINAL_VERSION_SPEC.md`
2. `docs/ROADMAP.md`
3. `docs/CURRENT_PHASE.md`
4. The latest relevant section of `WORK_LOG.md`
5. `git status --short --branch`

Do not rely on chat memory alone. If these files conflict with the chat, stop and state the conflict.

## Final-Version Gate Rule

Never describe a stage, batch, or deployment as "final" unless the relevant Gate in `docs/CURRENT_PHASE.md` and `docs/FINAL_VERSION_SPEC.md` has passed.

Allowed language:

- "online milestone"
- "F1 visual foundation audit passed"
- "F2 batch accepted"
- "not final yet"
- "blocked by visual/data/model quality"

Forbidden language unless all final Gates pass:

- "final complete version is done"
- "project complete"
- "ready as final"

## Responsibility Split

Codex owns:

- final standard and task decomposition
- integration and code review
- browser QA and screenshots
- deployment verification
- rejecting weak Claude or agent batches
- updating `WORK_LOG.md` and Obsidian notes

Claude owns only bounded implementation batches:

- MapLibre paint/CSS visual passes
- boundary data batches with explicit file scope
- individual GLB/model scripts
- focused UI implementation slices

Claude does not decide whether work is finally acceptable.

## Claude Task Protocol

When Claude is used:

1. Create a prompt from `.claude-runs/TEMPLATE.md`.
2. Keep the write scope narrow.
3. State forbidden files explicitly.
4. Require exact verification commands.
5. Save the prompt and output under `.claude-runs/`.
6. Codex must review the diff before committing.

Use UTF-8 prompt files for Chinese text. Do not pipe Chinese prompt text directly through PowerShell.

## Current Project Priority

The current phase is defined only by `docs/CURRENT_PHASE.md`.

As of this protocol, the project is in F1: final visual foundation. Do not begin broad F2 boundary batches, broad F3 GLB batches, or F5 product UI expansion until F1 has passed its Gate.

## Verification Habit

For every non-trivial change:

1. Verify before changing.
2. Apply the smallest safe change.
3. Run the phase-specific checks.
4. Use the browser when the UI or map changes.
5. Record results and follow-ups in `WORK_LOG.md`.

Passing `npm run check` alone is not enough for visual/map work.
