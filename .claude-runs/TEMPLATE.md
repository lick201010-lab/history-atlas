# Claude Task Template

## Task Name

Replace with a short, unique task name.

## Project Context

This project is History Atlas. `https://atlas.ckl.hk/` is only an online milestone, not the final complete product.

Before editing, read:

- `AGENTS.md`
- `docs/FINAL_VERSION_SPEC.md`
- `docs/ROADMAP.md`
- `docs/CURRENT_PHASE.md`
- latest relevant section of `WORK_LOG.md`

## Goal

State the exact outcome for this task.

## Allowed Write Scope

List exact files or folders Claude may edit.

## Forbidden Write Scope

List exact files or folders Claude must not edit.

## Required Behavior

List concrete behavior requirements.

## Verification Commands

Run the exact commands below unless the task says otherwise:

```powershell
npm run check
```

For visual/map work, also run:

```powershell
npm run audit:visual-foundation
```

## Output Requirements

In the final response, list:

- files changed
- exact commands run
- pass/fail result
- known remaining visual issues
- any screenshots or reports generated

Do not claim the final complete version is done.
