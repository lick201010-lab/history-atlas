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

## Main Thread and Subagent Methodology

Codex main thread owns supervision, coordination, acceptance, and integration only.

The main thread should keep context small:

- Read required project state files first.
- Avoid loading large implementation files unless needed for review or integration.
- Delegate bounded implementation and investigation work to subagents whenever the task can be isolated.
- Keep a visible todo list for the boss in `README.md`, and keep phase truth in `docs/CURRENT_PHASE.md`.

Every subagent task must define:

- Owner: Codex, Claude, or named worker.
- Goal: the exact bounded outcome.
- Write scope: files the subagent may edit.
- Forbidden scope: files the subagent must not edit.
- Verification commands: exact commands and browser checks required.
- Expected output: summary, changed files, risks, and unresolved follow-ups.

Context compaction does not reset project memory. Before and after compaction, the main thread must recover state from:

1. `AGENTS.md`
2. `docs/CURRENT_PHASE.md`
3. latest relevant `WORK_LOG.md` entry
4. `git status --short --branch`
5. any open `.claude-runs/` or subagent task records

The main thread must not forget active subagents across compaction. It must wait for each subagent result, review the diff or output, and then explicitly accept, reject, or request revision.

Subagent output is never automatically accepted as correct. Codex main thread must perform review, run required checks, and decide whether the batch is acceptable.

After a subagent task is accepted, rejected, or superseded, the main thread must close, archive, or mark that subagent inactive and record the result in the appropriate task log.

## Sidecar Experiment Rule

Experimental sidecars, such as `mini-game/`, must remain isolated until their Gate passes.

- Do not let sidecar experiments modify web runtime files unless a task explicitly says to integrate them.
- Record sidecar status separately from the main web product phase.
- Passing structure/import checks is not the same as passing visual/runtime QA.
- A sidecar can be accepted as a baseline without being accepted as the product direction.

## Partner Correction Rule

Codex is the user's engineering partner, not an agreement machine.

If the user proposes a direction that would make the project weaker, slower, less truthful, or less maintainable, Codex must say so plainly and propose the better path. This is especially important for:

- calling an online milestone the final product
- accepting fake coast-aware boundary data
- merging rough placeholder GLB models into a final-quality gate
- doing huge unchecked batches just because they seem faster
- skipping browser QA for visual/map changes

Disagreement should be specific, evidence-based, and followed by a concrete implementation path.

## F2 Boundary Compiler Methodology

For F2 boundary work, prefer the Boundary Compiler workflow over hand-editing final GeoJSON:

- Subagents author or improve compact `boundary-anchors.json` specs and compiler utilities.
- The compiler generates F2-compatible `boundaries-simplified.json` features.
- Generated features must be truthfully labeled. Do not mark a feature `coastline-aware-rough` unless it actually uses land/coast clipping or an equivalent coast-aware method.
- Browser screenshots at zoom 4-5 remain mandatory because compiler output can still look wrong.
- Codex main thread accepts or rejects each generated batch after diff review, data validation, boundary audit, and browser QA.

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

As of 2026-06-04, the project is in F2: controlled boundary refinement. Do not infer the phase from this paragraph in future sessions; always read `docs/CURRENT_PHASE.md` first. Broad F3 GLB batches, F5 product UI expansion, and any "final complete" claim remain blocked until their Gates pass.

## Verification Habit

For every non-trivial change:

1. Verify before changing.
2. Apply the smallest safe change.
3. Run the phase-specific checks.
4. Use the browser when the UI or map changes.
5. Record results and follow-ups in `WORK_LOG.md`.

Passing `npm run check` alone is not enough for visual/map work.
