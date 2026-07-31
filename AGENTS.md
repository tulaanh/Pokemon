# AGENTS.md

Vanilla-JS browser game (Pokémon-style gacha / merge / battle) with all UI text in Vietnamese. No framework, no build system, no tests, no `package.json`.

## Run & verify
- No dev server or build step: just open `index.html` in a browser. Verification is manual clicking.
- The Gacha tab has a built-in cheat panel (add PokePoint/PokeGacha, set level, reset resources) — use it to test instead of editing state.
- There are no lint/test commands. Don't invent them.

## Architecture
- Script load order in `index.html` is intentional and dependency-ordered; `app.js` (the only entry point, `window.onload`) MUST stay last. Add new `js/*.js` files before `app.js`, after their dependencies (data → state/utils → features → battle).
- Data lives in `pokemonData.js` (`POKEMON_DATA`, `RARITY_LEVELS`, `ELEMENTAL_SKILL_TEMPLATES`) and `campaigns.js` (enemy/wave data).
- Global mutable state is declared in `js/state.js`: `team`, `gems`, `gold`, `inventory`, `gameState`. Auto-saves to `localStorage` key `pokemonGameState` every 5s and on unload.
- Everything is global and called via inline `onclick="fn()"` attributes in `index.html`. Do not convert to modules or rename functions without updating the HTML attributes.

## Gotchas
- `js/saveSystem.js` is a trap: untracked, NOT included in `index.html`, and redeclares `gameState` plus its own save functions. Never load it — it conflicts with `js/state.js`.
- `js/skills.js` is untracked but IS loaded by `index.html` — part of an in-progress skill system.
- Keep new UI text and comments in Vietnamese to match the codebase.
- Branch `develop` currently has a large uncommitted refactor in progress; don't commit unless asked.

## Environment
- Windows + PowerShell 5.1: no `&&` chaining — use `cmd1; if ($?) { cmd2 }`.
- Git `core.autocrlf=true`: tree is LF; diffs may show LF→CRLF warnings, which are harmless.
