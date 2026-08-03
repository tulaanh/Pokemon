# Task: Add First-Time Login & Starter Pokémon Selection

## Requirements
1. Show login/registration modal on first login
2. Player enters their name
3. Player selects 1 of 3 Legendary starter Pokémon: Bulbasaur, Charmander, Squirtle

## Implementation Plan

### 1. Update Store (src/game/store.js)
- [x] Add `playerName` field to player state
- [x] Add `hasCompletedFirstLogin` flag to track first login
- [x] Update `defaultState()` to include these fields
- [x] Update `saveGameState()` and `loadGameState()` to persist these fields

### 2. Add Starter Pokémon to Data (src/game/data.js)
- [x] Add Charmander to POKEMON_SPECIES (Fire type)
- [x] Add Squirtle to POKEMON_SPECIES (Water type)
- Note: Bulbasaur already exists

### 3. Create Login Modal Component (src/components/LoginModal.vue)
- [x] Modal with player name input
- [x] 3 starter Pokémon cards (Bulbasaur, Charmander, Squirtle)
- [x] Each with Legendary rarity styling
- [x] Confirm button to save selection

### 4. Add Starter Pokémon Logic (src/game/store.js or new module)
- [x] Function to create starter Pokémon with Legendary rarity
- [x] Function to complete first login flow

### 5. Integrate into App.vue
- [x] Import LoginModal
- [x] Show modal when `!store.gameState.player.hasCompletedFirstLogin` (computed, reactive)
- [x] Handle completion callback

### 6. Test
- [x] Run `npm run build`
- [x] Test in browser

### 7. Fix Bug: Reset Game Gives Free Legendary
- [x] Updated `saveGameState()` to persist `playerName` and `hasCompletedFirstLogin`
- [x] Updated `loadGameState()` to restore `playerName` and `hasCompletedFirstLogin`
- [x] This ensures reset properly clears these fields and login modal appears correctly

### 8. Fix Bug: Player Name Not Displaying in Header
- [x] Changed `showLoginModal` from `ref` to `computed` in App.vue for reactivity
- [x] Updated GameHeader.vue to display `player.playerName` instead of hardcoded "Player 1"
- [x] Falls back to "Player 1" if no name is set
