# History Atlas Agent Protocol

This project is moving toward the final complete version of History Atlas. The deployed site and package version `v0.1.0` are online milestones only. They are not the final product.

Every Codex, Claude, or other agent must follow this protocol before editing files.

## Startup Context

Before implementation, read:

1. `docs/FINAL_VERSION_SPEC.md`
2. `docs/ROADMAP.md`
3. `docs/CURRENT_PHASE.md`
4. The latest relevant section of `WORK_LOG.md`
5. `git status --short --branch`

Do not rely on chat memory alone. If these files conflict with the chat, state the conflict before changing files.

## Final-Version Gate Rule

Never describe a stage, batch, deployment, or local build as "final" unless all relevant gates in `docs/FINAL_VERSION_SPEC.md` and `docs/CURRENT_PHASE.md` have passed.

Allowed language:

- online milestone
- phase pass
- batch accepted
- not final yet
- blocked by visual, data, model, interaction, performance, or deployment quality

Forbidden language until F1-F6 are all accepted:

- final complete version is done
- project complete
- ready as final

## Responsibility Split

Codex owns:

- final standard and task decomposition
- integration and review
- browser QA and screenshots
- deployment verification
- rejecting weak Claude or agent batches
- updating `WORK_LOG.md` and Obsidian notes

Claude owns only bounded implementation batches:

- MapLibre paint and CSS visual passes
- boundary data batches with explicit file scope
- individual GLB/model scripts
- focused UI implementation slices

Claude does not decide whether work is accepted.

## Claude Task Protocol

When Claude is used:

1. Create a prompt from `.claude-runs/TEMPLATE.md`.
2. Keep write scope narrow.
3. State forbidden files explicitly.
4. Require exact verification commands.
5. Save the prompt and output under `.claude-runs/`.
6. Codex must review the diff before committing.

Use UTF-8 prompt files. Prefer stdin for long prompts.

## Current Priority

The current phase is defined only by `docs/CURRENT_PHASE.md`.

## Verification Habit

For every non-trivial change:

1. Verify the current state before changing.
2. Apply the smallest safe change that moves the final plan forward.
3. Run the phase-specific checks.
4. Use the browser when UI or map behavior changes.
5. Record results and follow-ups in `WORK_LOG.md`.

Passing `npm run check` alone is not enough for visual, map, model, or interaction work.
