# Wild Encounter System Implementation Progress

## Task Overview
Implement wild Pokémon encounters on the world map with Pokéball capture system.

## Phase 1: Core Infrastructure (✅ Already Exists)
- [x] Pokéball catalog in `src/game/shop.js` with 4 ball types (PokeBall, GreatBall, UltraBall, MasterBall)
- [x] Capture logic in `src/game/capture.js` (rollWildEncounter, getCaptureChance, attemptCapture)
- [x] BattleArena.vue already has wild battle mode and Pokéball selection modal
- [x] ShopView.vue has Pokéball purchase UI with buy x1/x5/x10 options
- [x] InventoryView.vue shows Pokéball inventory
- [x] Pokéball assets in `public/images/items/` with MIT license attribution
- [x] WorldMap.vue has `onWildEncounter` callback to open wild battle
- [x] `maps.js` has encounter config for town map (enabled with Pidgey, Rattata, Caterpie pool)

## Phase 2: Encounter System in WorldScene (✅ Fully Implemented)
- [x] Wild encounter state management in `worldScene.js` (wildEncounterState object)
- [x] Spawn logic (time-based + distance-based) in `updateWildEncounter()`
- [x] Valid spawn tile checking in `isValidSpawnTile()` (avoids walls, doors, NPCs, player)
- [x] Random position finding in `findRandomSpawnPosition()` (10-20 tile radius around player)
- [x] Sprite rendering with blink effect in `spawnWildPokemon()` (emoji sprite with Phaser tween)
- [x] Interaction handling in `handleWildEncounter()` (calls callback to open battle)
- [x] Cleanup and cooldown in `clearWildEncounter()` (removes sprite, starts cooldown)
- [x] Encounter config passed from WorldMap.vue via `setWorldRuntime` (encounters property)

## Phase 3: Battle Integration (✅ Already Implemented)
- [x] App.vue `handleOpenMode` handles 'wild' mode → calls `startWildBattle(pokemon)`
- [x] BattleArena.vue watches `battle.mode === 'wild'` → opens Pokéball selection modal
- [x] BattleArena.vue watches `battle.enemyPoke?.hp <= 0` → reopens modal if closed
- [x] `onSelectPokeball` calls `attemptCapture()` from capture.js
- [x] Capture success → adds to team, updates Pokédex, shows toast, closes battle
- [x] Capture failure → shows toast, ends battle (wild Pokémon flees)
- [x] "Bỏ chạy" button closes modal and ends battle

## Phase 4: Save/Load Migration (✅ Already Implemented)
- [x] `store.js` default inventory includes all 4 Pokéball types initialized to 0
- [x] `store.js` loadGameState migration (lines 156-159) ensures Pokéball fields exist
- [x] `capture.js` `migratePokeballInventory()` function available for manual migration
- [x] `initStore()` in store.js calls `loadGameState()` on startup

## Verification
- [x] `npm run build` completed successfully (no errors)
- [x] Dev server running on http://localhost:5174/

## Complete Flow (Verified in Code)
1. **Player walks on town map** → `updateWildEncounter(delta)` called every frame
2. **Timer or distance triggers spawn** → `spawnWildPokemon()` finds valid tile, creates sprite with blink effect
3. **Player walks to encounter** → `getInteractTarget()` detects interaction, `handleWildEncounter()` called
4. **Callback fires** → `onWildEncounter(pokemon)` in WorldMap.vue → `emit('open', 'wild', pokemon)`
5. **App.vue handles mode** → `handleOpenMode('wild', pokemon)` → calls `startWildBattle(pokemon)` from battle.js
6. **BattleArena opens** → watches mode='wild' → opens Pokéball modal with catalog
7. **Player selects ball** → `attemptCapture()` calculates chance, consumes ball, tries capture
8. **Success** → Pokémon added to team, Pokédex updated, battle closes with success toast
9. **Failure** → Ball consumed, wild Pokémon flees, battle closes with failure toast
10. **Cooldown** → `clearWildEncounter()` sets cooldown timer before next spawn

## All Requirements Met ✅
- Pokémon spawn in walkable areas (not walls/doors/NPCs) ✅
- Sprite with blink effect ✅
- Interaction to start battle ✅
- Pokéball selection modal with capture chance display ✅
- 4 Pokéball types (regular, great, ultra, master) with different multipliers ✅
- Purchase in Shop, view in Inventory ✅
- Assets downloaded with MIT license attribution ✅
- Encounters only on town map (configurable per map) ✅
- No encounter persistence in save (session-only) ✅
- Cooldown after encounter ✅
- Team full check before capture ✅
- Ball not consumed if team full / capture not attempted ✅

**Status: IMPLEMENTATION COMPLETE - Ready for testing**