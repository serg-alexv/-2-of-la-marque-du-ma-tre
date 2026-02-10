# Contributing

## Golden rule
**One PR = one scope.** If you need "and", split the PR.

## Antigravity Definition of Done (DoD)
Every PR must include:
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- i18n key check: `npm run i18n:check` (if PR touches UI/copy/i18n)
- Manual smoke steps in PR description (exact steps)
- Storage impact documented (or "none")
- Permissions safety: mic denied / AudioContext suspended => no false penalties
- No unrelated refactors

## Review rubric (fast)
1) Scope (1–2 min): only what the PR claims  
2) Safety (2–5 min): storage/mic/audio risks and graceful fallbacks  
3) Determinism: core rules deterministic; content layer cannot change outcomes  
4) CI green + manual smoke passed  
5) Merge: squash merge, PR title becomes commit subject

## Branching
- `feature/<short-desc>`
- `fix/<short-desc>`
- `chore/<short-desc>`

## Release tags
- Patch releases only until stable: `v0.0.x`
- Each release links to notes (PR list / changes)

## Notes
“Intense Mode / Accountability Theater” is capability-gated:
- Only available when `VITE_INTENSE_CAPABLE=1`
- Public builds must not expose the toggle and must force it off at runtime