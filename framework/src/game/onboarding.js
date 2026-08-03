// ==========================================
// ONBOARDING: LOGIC NHẬP TÊN + CHỌN STARTER LẦN ĐẦU
// (chạy trong Phòng Lab của Giáo sư Oak)
// ==========================================
import { POKEMON_SPECIES, RARITIES } from './data.js'
import { generateSkillInstance, ensureSkillsByLevel } from './gacha.js'
import { rollPassive } from './skills.js'
import { recalculatePokemonStats } from './stats.js'
import { store } from './store.js'

export const STARTER_NAMES = ['Bulbasaur', 'Charmander', 'Squirtle']

export const STARTER_LEVEL = 1

export const STARTER_RARITY = RARITIES.find((r) => r.name === 'Legendary')

export function getStarterData(name) {
  return POKEMON_SPECIES.find((s) => s.name === name)
}

// Tạo Pokémon khởi đầu: độ hiếm Legendary, cấp 1 (Basic + Skill1)
export function buildStarterPoke(speciesName) {
  const species = getStarterData(speciesName)
  if (!species) return null
  const rarity = STARTER_RARITY
  const pokeLevel = STARTER_LEVEL

  const newPoke = {
    id: 'starter-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10),
    name: species.name,
    type: species.type,
    rarity,
    vLevel: 0,
    level: pokeLevel,
    exp: 0,
    maxExp: Math.round(pokeLevel * 50 + Math.pow(pokeLevel, 1.5) * 10),
    maxHp: 0,
    hp: 0,
    shield: 0,
    mp: 0,
    initMp: Math.round(species.baseInitMp * rarity.statMult),
    atk: 0,
    speed: 0,
    def: 0,
    iv: {
      hp: 0.9 + Math.random() * 0.2,
      atk: 0.9 + Math.random() * 0.2,
      def: 0.9 + Math.random() * 0.2,
      speed: 0.9 + Math.random() * 0.2,
    },
    effects: [],
    passive: null,
    passives: [rollPassive(species.type)],
    talents: [],
    skills: [
      generateSkillInstance(species.type, 'Basic', rarity, pokeLevel),
      generateSkillInstance(species.type, 'Skill1', rarity, pokeLevel),
    ],
  }
  newPoke.passive = newPoke.passives[0]

  ensureSkillsByLevel(newPoke)
  recalculatePokemonStats(newPoke, store.gymBuffs)
  newPoke.hp = newPoke.maxHp
  return newPoke
}
