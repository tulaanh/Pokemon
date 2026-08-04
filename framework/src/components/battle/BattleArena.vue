<script setup>
import { computed, ref, watch } from 'vue'
import { store } from '../../game/store.js'
import {
  battle,
  getActivePlayerPoke,
  getEffectiveSpeed,
  getInBattleSwitchOptions,
  shiftSkillQueue,
} from '../../game/battle.js'
import { useBattleFx } from './useBattleFx.js'
import { useSkill, performInBattleSwitch, continueAfterWildCapture } from '../../game/campaign.js'
import { useGymSkill, performGymInBattleSwitch, GYM_DATA } from '../../game/gym.js'
import { useStorySkill, performStoryInBattleSwitch } from '../../game/story.js'
import { useTowerSkill, performTowerInBattleSwitch, continueTower, quitTower } from '../../game/tower.js'
import { getEffectLabel } from '../../game/data.js'
import {
  getPokeballCatalog,
} from '../../game/shop.js'
import {
  getCaptureChance,
  attemptCapture,
} from '../../game/capture.js'
import { showToast } from '../ui/toast.js'
import RarityText from '../RarityText.vue'
import TypeBadge from '../poke/TypeBadge.vue'
import PokeSprite from '../PokeSprite.vue'
import SkillSelectModal from '../shop/SkillSelectModal.vue'
import BattleProjectile from './BattleProjectile.vue'

const emit = defineEmits(['close-result', 'close-battle'])

// Wild Pokémon bắt được từ encounter
const wildPokemon = ref(null)
// Pokéball selection modal state
const pokeballModalOpen = ref(false)
const pokeballCatalog = ref([])

const playerPoke = computed(() => getActivePlayerPoke())
const switchOpen = ref(false)
const switchOptions = computed(() => getInBattleSwitchOptions())
const logOpen = ref(true)

// --- ANIMATION CHIẾN ĐẤU ---
const battlefieldEl = ref(null)
const playerSpriteEl = ref(null)
const enemySpriteEl = ref(null)

const {
  shownPlayerHpPct,
  shownEnemyHpPct,
  playerAnim,
  enemyAnim,
  impactFx,
  statusFx,
  shaking,
  floatingNums,
  projectiles,
  burstFor,
} = useBattleFx(playerPoke, { battlefieldEl, playerSpriteEl, enemySpriteEl })

function removeProjectile(id) {
  projectiles.value = projectiles.value.filter((p) => p.id !== id)
}

function animClassFor(anim) {
  if (!anim.name) return ''
  return anim.name === 'lunge' ? `fx-lunge-${anim.side}` : `fx-${anim.name}`
}

const playerAnimClass = computed(() => animClassFor(playerAnim))
const enemyAnimClass = computed(() => animClassFor(enemyAnim))
const playerBurst = computed(() => (impactFx.side === 'player' ? burstFor(impactFx.casterType) : null))
const enemyBurst = computed(() => (impactFx.side === 'bot' ? burstFor(impactFx.casterType) : null))
const playerNums = computed(() => floatingNums.value.filter((n) => n.side === 'player'))
const enemyNums = computed(() => floatingNums.value.filter((n) => n.side === 'bot'))

const skillSlots = computed(() => {
  const p = playerPoke.value
  const slots = []
  for (let i = 0; i < 4; i++) {
    slots.push({
      i,
      skill: p && i < p.skills.length ? p.skills[i] : null,
      lockedLevel: i === 2 ? 15 : 30,
    })
  }
  return slots
})

const EFFECT_COLORS = {
  burn: 'bg-red-100 text-red-700 border-red-300',
  shock: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  poison: 'bg-purple-100 text-purple-700 border-purple-300',
  bleed: 'bg-rose-100 text-rose-700 border-rose-300',
  stun: 'bg-slate-100 text-slate-700 border-slate-300',
  extra_turn: 'bg-green-100 text-green-700 border-green-300',
  buff_atk: 'bg-green-100 text-green-700 border-green-300',
  buff_def: 'bg-green-100 text-green-700 border-green-300',
  debuff_atk: 'bg-red-100 text-red-700 border-red-300',
  debuff_def: 'bg-red-100 text-red-700 border-red-300',
  thorn: 'bg-orange-100 text-orange-700 border-orange-300',
}

function effectClass(type) {
  return EFFECT_COLORS[type] || 'bg-slate-100 text-slate-700 border-slate-300'
}

function barPct(p, key) {
  if (!p) return 0
  if (key === 'shield') return Math.min(100, (p.shield / p.maxHp) * 100)
  return p[key]
}

function skillValueText(sk) {
  if (sk.power) return `Dame: ${(playerPoke.value ? playerPoke.value.atk : 0) + (sk.power || 0)}`
  if (sk.shield) return `Khiên: +${sk.shield}`
  if (sk.heal) return `Hồi: +${sk.heal}`
  return 'Buff'
}

const EFFECT_LABELS = {
  burn: 'Đốt',
  shock: 'Sốc điện',
  poison: 'Độc',
  bleed: 'Chảy máu',
  stun: 'Choáng',
  extra_turn: 'Tăng tốc +1 lượt',
  buff_atk: 'Tăng ATK',
  buff_def: 'Tăng DEF',
  debuff_atk: 'Giảm ATK',
  debuff_def: 'Giảm DEF',
  thorn: 'Phản sát thương',
}

function effectText(eff) {
  if (!eff) return ''
  const dotTypes = ['burn', 'shock', 'poison', 'bleed']
  const statTypes = ['buff_atk', 'buff_def', 'debuff_atk', 'debuff_def']
  let text
  if (eff.type === 'stun') {
    text =
      eff.chance !== undefined
        ? `Choáng ${eff.chance}% (${eff.duration || 1} lượt)`
        : eff.chanceMin !== undefined
          ? `Choáng ${eff.chanceMin}-${eff.chanceMax}% (1-${eff.durationMax || 2} lượt)`
          : 'Choáng (bỏ lượt)'
  }
  else if (eff.type === 'extra_turn') text = 'Tăng tốc: +1 lượt đánh'
  else if (dotTypes.includes(eff.type)) text = `${EFFECT_LABELS[eff.type]}: ${eff.val}%`
  else if (statTypes.includes(eff.type)) text = `${eff.val > 0 ? '+' : ''}${eff.val}% ${EFFECT_LABELS[eff.type]}`
  else if (eff.type === 'thorn') text = `Phản ${eff.val}% sát thương`
  else text = getEffectLabel(eff)
  if (eff.type === 'stun') return text
  return `${text} (${eff.duration} lượt)`
}

function isSkillDisabled(sk) {
  let p = playerPoke.value
  if (!p) return true
  if (battle.currentTurnOwner !== 'player' || battle.isProcessingTurn) return true
  if (p.hp <= 0 || (battle.enemyPoke && battle.enemyPoke.hp <= 0)) return true
  if (p.mp < sk.cost || sk.currentCd > 0) return true
  return false
}

function onUseSkill(i) {
  if (battle.mode === 'gym') useGymSkill(i)
  else if (battle.mode === 'story') useStorySkill(i)
  else if (battle.mode === 'tower') useTowerSkill(i)
  else useSkill(i) // campaign, wild
}

function openSwitch() {
  switchOpen.value = true
}

function onSwitch(idx) {
  switchOpen.value = false
  if (battle.mode === 'gym') performGymInBattleSwitch(idx)
  else if (battle.mode === 'story') performStoryInBattleSwitch(idx)
  else if (battle.mode === 'tower') performTowerInBattleSwitch(idx)
  else performInBattleSwitch(idx) // campaign, wild
}

// --- KẾT QUẢ MODAL ---
const resultBody = computed(() => {
  let gym = battle.gymType ? GYM_DATA[battle.gymType] : null
  if (battle.resultWin) {
    if (battle.mode === 'training') {
      return {
        title: '🎓 HOÀN THÀNH HUẤN LUYỆN!',
        items: [
          'Bạn đã nắm được cơ chế chiến đấu cơ bản!',
          `⭐ Kinh Nghiệm: +${battle.rewards.exp} EXP`,
          `🪙 Vàng: +${battle.rewards.gold || 0} Vàng`,
        ],
        pokedexHint: false,
      }
    }
    if (battle.mode === 'gym') {
      let progress = store.gymProgress[battle.gymType] || 0
      let buffMsg =
        progress >= 5
          ? `🏅 BUFF GYM: Tất cả Pokémon hệ ${battle.gymType} +10% chỉ số!`
          : `📊 Tiến độ: Ải ${progress}/5`
      return {
        title: '🏆 THẮNG GYM!',
        items: [`🪙 Vàng: +${battle.rewards.gold}`, `⭐ Kinh Nghiệm: +${battle.rewards.exp} EXP`, buffMsg],
        pokedexHint: false,
      }
    }
    if (battle.mode === 'story') {
      let candyText = battle.rewards.candy ? `🍬 Kẹo Kinh Nghiệm: +${battle.rewards.candy} viên` : ''
      let items = [
        `💎 Gem Thưởng: +${battle.rewards.gems} Gem`,
        `⭐ Kinh Nghiệm: +${battle.rewards.exp} EXP`,
        `🪙 Vàng: +${battle.rewards.gold || 0} Vàng`,
      ]
      if (candyText) items.push(candyText)
      return { title: '🏆 CẢNH PHIM THÀNH CÔNG!', items, pokedexHint: false }
    }
    if (battle.mode === 'tower') {
      let pot = battle.towerPot || { gold: 0, gems: 0, candy: 0 }
      let items = [
        `🗼 Đã chinh phục Tầng ${battle.towerFloor}!`,
        `💰 Rương: +${pot.gold} 🪙 | +${pot.gems} 💎${pot.candy ? ` | +${pot.candy} 🍬` : ''}`,
        `⭐ Kinh Nghiệm: +${battle.rewards.exp} EXP`,
      ]
      if (battle.towerFloor % 5 === 0) items.push(`💚 Mốc tầng: Pokémon còn sống hồi +20% HP tối đa!`)
      return { title: '🎉 CHINH PHỤC TẦNG!', items, pokedexHint: false }
    }
    let candyText = battle.rewards.candy ? `🍬 Kẹo Kinh Nghiệm: +${battle.rewards.candy} viên` : ''
    let items = [
      `💎 Gem Thưởng: +${battle.rewards.gems} Gem`,
      `⭐ Kinh Nghiệm: +${battle.rewards.exp} EXP`,
      `🪙 Vàng: +${battle.rewards.gold || 0} Vàng`,
    ]
    if (candyText) items.push(candyText)
    return { title: '🏆 CHIẾN THẮNG!', items, pokedexHint: false }
  }

  // THẤT BẠI
  if (battle.mode === 'training') {
    return {
      title: '💀 THẤT BẠI!',
      items: [
        'Đừng nản chí — hãy chú ý đến sát thương, khiên và hiệu ứng!',
        '💡 Bấm Quay Lại rồi thử lại trận huấn luyện.',
      ],
      pokedexHint: false,
    }
  }
  if (battle.mode === 'gym') {
    return {
      title: '💀 THẤT BẠI!',
      items: [
        `Đội hình đã gục ngã tại ải ${(store.gymProgress[battle.gymType] || 0) + 1}/5 của ${gym?.name}!`,
        '💡 Nâng cấp Pokémon hệ ' + (battle.gymType || '') + ' lên level cao hơn.',
        '💡 Dùng Kẹo Kinh Nghiệm để tăng cấp nhanh.',
        '💡 Hợp nhất (Merge) để tăng V-Level.',
      ],
      pokedexHint: false,
    }
  }
  if (battle.mode === 'story') {
    return {
      title: '💀 CẢNH PHIM THẤT BẠI!',
      items: [
        `Toàn bộ đội hình đã gục ngã tại Wave ${battle.waveIdx + 1}/${battle.currentEnemies.length}!`,
        '💡 Vào mục Gacha quay thêm Pokémon mạnh hơn.',
        '💡 Dùng Kẹo Kinh Nghiệm để tăng cấp nhanh.',
      ],
      pokedexHint: true,
    }
  }
  if (battle.mode === 'tower') {
    return {
      title: '💀 THÁP THẤT BẠI!',
      items: [
        `Toàn bộ đội hình đã gục ngã tại Tầng ${battle.towerFloor}!`,
        `😭 Rương thưởng trong run này đã mất hết...`,
        `🏅 Kỷ lục Tháp giữ nguyên: Tầng ${store.towerBestFloor || 0}`,
      ],
      pokedexHint: false,
    }
  }
  if (battle.mode === 'wild') {
    return {
      title: '💀 ĐỘI HÌNH GỤC NGÃ!',
      items: [
        'Toàn bộ đội hình đã gục ngã trước Pokémon hoang dã!',
        '🌿 Pokémon hoang dã đã thoát khỏi khu vực...',
        '💡 Hãy chọn đội hình mạnh hơn hoặc hạ gục nó để tăng tỷ lệ bắt.',
      ],
      pokedexHint: false,
    }
  }
  return {
    title: '💀 THẤT BẠI!',
    items: [
      `Toàn bộ đội hình đã gục ngã tại Wave ${battle.waveIdx + 1}/${battle.currentEnemies.length}!`,
      '💡 Vào mục Gacha quay thêm Pokémon mạnh hơn.',
      '💡 Vào mục Hợp Nhất (Merge) để nâng cấp V-Level.',
    ],
    pokedexHint: true,
  }
})

function onTowerNext() {
  battle.resultOpen = false
  continueTower()
}

function onTowerQuit() {
  battle.resultOpen = false
  quitTower()
  emit('close-result')
}

const isTowerWin = computed(() => battle.resultOpen && battle.resultWin && battle.mode === 'tower')

const isGymPlayer = computed(() => battle.mode === 'gym')

// Mở modal chọn Pokéball (nút Bắt trong trận hoặc khi wild Pokémon gục ngã)
function openPokeballModal() {
  if (battle.mode !== 'wild') return
  pokeballCatalog.value = getPokeballCatalog()
  pokeballModalOpen.value = true
}

// Khi wild Pokémon bị hạ gục (hp <= 0) -> tự mở modal chọn Pokéball
watch(() => battle.enemyPoke?.hp, (newHp) => {
  if (battle.mode === 'wild' && battle.enemyPoke && newHp <= 0 && !pokeballModalOpen.value) {
    pokeballCatalog.value = getPokeballCatalog()
    pokeballModalOpen.value = true
  }
})

// Hàm ném Pokéball
function onSelectPokeball(ballId) {
  const result = attemptCapture(battle.enemyPoke, ballId)

  if (!result.ok) {
    // Lỗi (không còn bóng / đội hình đầy...) — giữ modal mở để chọn bóng khác
    showToast(result.message, 'error')
    return
  }

  pokeballCatalog.value = getPokeballCatalog()

  if (result.success) {
    // Bắt thành công
    pokeballModalOpen.value = false
    showToast(result.message, 'success')
    setTimeout(() => emit('close-result'), 2000)
    return
  }

  // Bắt thất bại — mất bóng, trận đấu tiếp tục
  pokeballModalOpen.value = false
  showToast(result.message, 'warning')
  if (battle.enemyPoke && battle.enemyPoke.hp > 0) {
    // Pokémon còn sống → đến lượt nó phản công
    continueAfterWildCapture()
  } else {
    // Pokémon đã gục không thể phản công → thoát khỏi khu vực
    showToast(`🌿 ${battle.enemyPoke.name} quá yếu nên đã thoát khỏi khu vực!`, 'info')
    setTimeout(() => emit('close-result'), 1500)
  }
}

// Đóng modal (không chạy trốn)
function closePokeballModal() {
  pokeballModalOpen.value = false
}

// Bỏ chạy — kết thúc trận bắt
function runAway() {
  pokeballModalOpen.value = false
  battle.resultOpen = false
  emit('close-result')
}
</script>

<template>
  <div class="app-card p-5">
    <!-- TITLE & WAVE -->
    <div class="mb-4 flex items-center justify-between gap-3 flex-wrap">
      <h3 class="text-base font-bold text-slate-800">{{ battle.battleTitle }}</h3>
      <div class="flex items-center gap-2">
        <span class="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{{ battle.waveIndicator }}</span>
        <button
          @click="battle.fxEnabled = !battle.fxEnabled"
          class="rounded-lg border px-3 py-1 text-xs font-semibold transition"
          :class="battle.fxEnabled ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200'"
        >
          ⚡ Hiệu ứng: {{ battle.fxEnabled ? 'Bật' : 'Tắt' }}
        </button>
      </div>
    </div>

    <!-- BATTLEFIELD: PLAYER (TRÁI) VS ENEMY (PHẢI) -->
    <div class="relative">
      <div ref="battlefieldEl" class="flex items-stretch gap-2 sm:gap-4" :class="{ 'fx-shake-screen': shaking }">
      <!-- PLAYER CARD -->
      <div v-if="playerPoke" class="relative flex-1 overflow-hidden rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white p-3 shadow-xl sm:p-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <div ref="playerSpriteEl" :class="playerAnimClass">
              <PokeSprite :name="playerPoke.name" :type="playerPoke.type" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" :rounded="'rounded-full'" />
            </div>
            <div class="min-w-0">
              <RarityText :rarity="playerPoke.rarity" :label="playerPoke.name" />
              <span v-if="playerPoke.vLevel > 0" class="ml-1 rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1 text-[10px] font-black text-white">V{{ playerPoke.vLevel }}</span>
              <span class="ml-1 text-xs text-slate-500">(Lv.{{ playerPoke.level }})</span>
              <TypeBadge :type="playerPoke.type" />
            </div>
          </div>
          <span class="shrink-0 rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">BẠN</span>
        </div>

        <div class="mt-3">
          <div class="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>HP</span>
            <span>{{ Math.max(0, playerPoke.hp) }}/{{ playerPoke.maxHp }}</span>
          </div>
          <div class="relative h-4 overflow-hidden rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300" :style="{ width: shownPlayerHpPct + '%' }"></div>
            <div v-if="playerPoke.shield > 0" class="absolute inset-y-0 left-0 rounded-full bg-sky-400/70 transition-all" :style="{ width: barPct(playerPoke, 'shield') + '%' }"></div>
          </div>
        </div>

        <div class="mt-2 grid grid-cols-1 gap-3">
          <div>
            <div class="mb-0.5 flex justify-between text-[10px] text-slate-500"><span>MP</span><span>{{ playerPoke.mp }}/100</span></div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all" :style="{ width: barPct(playerPoke, 'mp') + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
          <span>SPD: {{ getEffectiveSpeed(playerPoke) }}</span>
          <span v-if="playerPoke.effects.length > 0" class="flex flex-wrap gap-1">
            <span v-for="eff in playerPoke.effects" :key="eff.name" class="rounded-md border px-1.5 py-0.5" :class="effectClass(eff.type)">
              {{ eff.name }} ({{ eff.duration }}t)
            </span>
          </span>
        </div>

        <!-- PLAYER FX OVERLAY -->
        <div class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div v-if="playerBurst" :key="impactFx.key" class="fx-burst" :style="{ color: playerBurst.color, textShadow: '0 0 24px ' + playerBurst.color + '88' }">
            {{ playerBurst.emoji }}
          </div>
          <div
            v-if="statusFx.side === 'player'"
            :key="statusFx.key"
            class="fx-status-badge absolute top-3 rounded-full border bg-white/95 px-3 py-1 text-[11px] font-bold shadow-lg"
            :class="statusFx.text.startsWith('🛡️') ? 'border-slate-300 text-slate-600' : 'border-fuchsia-300 text-fuchsia-600'"
          >
            {{ statusFx.text }}
          </div>
          <div v-for="n in playerNums" :key="n.id" class="fx-num absolute top-1/4 left-0 right-0 text-center font-black" :class="n.cls">
            {{ n.text }}
          </div>
        </div>
      </div>
      <div v-else class="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6">
        <span class="text-3xl opacity-30">💤</span>
        <span class="mt-1 text-xs text-slate-400">Không có Pokémon</span>
      </div>

      <!-- VS DIVIDER -->
      <div class="flex w-8 items-center justify-center sm:w-12">
        <div
          class="flex h-12 w-8 items-center justify-center rounded-full border-2 text-center text-[9px] font-black transition sm:h-14 sm:w-10 sm:text-[10px]"
          :class="battle.currentTurnOwner === 'player' ? 'border-amber-400 bg-amber-100 text-amber-600' : 'border-red-300 bg-red-100 text-red-600'"
        >
          {{ battle.currentTurnOwner === 'player' ? '⚡' : '🤖' }}
        </div>
      </div>

      <!-- ENEMY CARD -->
      <div v-if="battle.enemyPoke" class="relative flex-1 overflow-hidden rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-white p-3 shadow-xl sm:p-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <div ref="enemySpriteEl" :class="enemyAnimClass">
              <PokeSprite :name="battle.enemyPoke.name" :type="battle.enemyPoke.type" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" :rounded="'rounded-full'" />
            </div>
            <div class="min-w-0">
              <RarityText :rarity="battle.enemyPoke.rarity" :label="battle.enemyPoke.name" />
              <span class="ml-1 text-xs text-slate-500">(Lv.{{ battle.enemyPoke.level }})</span>
              <TypeBadge :type="battle.enemyPoke.type" />
              <span v-if="battle.enemyPoke.boss" class="ml-1 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">👑 BOSS</span>
              <span v-else-if="battle.enemyPoke.elite" class="ml-1 rounded-md bg-sky-500 px-1.5 py-0.5 text-[10px] font-black text-white">✨ ELITE</span>
              <span v-if="isGymPlayer" class="ml-1 text-[10px] font-semibold text-slate-400">[{{ battle.gymActiveEnemyIdx + 1 }}/3]</span>
            </div>
          </div>
          <span class="shrink-0 rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">ĐỐI THỦ</span>
        </div>

        <div class="mt-3">
          <div class="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>HP</span>
            <span>{{ Math.max(0, battle.enemyPoke.hp) }}/{{ battle.enemyPoke.maxHp }}</span>
          </div>
          <div class="relative h-4 overflow-hidden rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300" :style="{ width: shownEnemyHpPct + '%' }"></div>
            <div v-if="battle.enemyPoke.shield > 0" class="absolute inset-y-0 left-0 rounded-full bg-sky-400/70 transition-all" :style="{ width: barPct(battle.enemyPoke, 'shield') + '%' }"></div>
          </div>
        </div>

        <div class="mt-2 grid grid-cols-1 gap-3">
          <div>
            <div class="mb-0.5 flex justify-between text-[10px] text-slate-500"><span>MP</span><span>{{ battle.enemyPoke.mp }}/{{ battle.enemyPoke.maxMp || 100 }}</span></div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-200">
              <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all" :style="{ width: barPct(battle.enemyPoke, 'mp') + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
          <span>SPD: {{ getEffectiveSpeed(battle.enemyPoke) }}</span>
          <span v-if="battle.enemyPoke.effects.length > 0" class="flex flex-wrap gap-1">
            <span v-for="eff in battle.enemyPoke.effects" :key="eff.name" class="rounded-md border px-1.5 py-0.5" :class="effectClass(eff.type)">
              {{ eff.name }} ({{ eff.duration }}t)
            </span>
          </span>
        </div>

        <!-- ENEMY FX OVERLAY -->
        <div class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div v-if="enemyBurst" :key="impactFx.key" class="fx-burst" :style="{ color: enemyBurst.color, textShadow: '0 0 24px ' + enemyBurst.color + '88' }">
            {{ enemyBurst.emoji }}
          </div>
          <div
            v-if="statusFx.side === 'bot'"
            :key="statusFx.key"
            class="fx-status-badge absolute top-3 rounded-full border bg-white/95 px-3 py-1 text-[11px] font-bold shadow-lg"
            :class="statusFx.text.startsWith('🛡️') ? 'border-slate-300 text-slate-600' : 'border-fuchsia-300 text-fuchsia-600'"
          >
            {{ statusFx.text }}
          </div>
          <div v-for="n in enemyNums" :key="n.id" class="fx-num absolute top-1/4 left-0 right-0 text-center font-black" :class="n.cls">
            {{ n.text }}
          </div>
        </div>
      </div>
      <div v-else class="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6">
        <span class="text-3xl opacity-30">💤</span>
        <span class="mt-1 text-xs text-slate-400">Không có đối thủ</span>
      </div>
      </div>

      <!-- ĐẠN BAY THEO HỆ -->
      <div class="pointer-events-none absolute inset-0 z-30">
        <BattleProjectile
          v-for="p in projectiles"
          :key="p.id"
          :type="p.type"
          :crit="p.crit"
          :start="p.start"
          :end="p.end"
          :delay="p.delay"
          :spin="p.spin"
          @done="removeProjectile(p.id)"
        />
      </div>
    </div>

    <!-- TURN BANNER -->
    <div class="mt-3 rounded-xl border px-3 py-1.5 text-center text-sm font-bold"
      :class="battle.currentTurnOwner === 'player' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-red-300 bg-red-50 text-red-600'">
      {{ battle.currentTurnOwner === 'player' ? '⚡ Lượt của BẠN — Chọn chiêu để tấn công!' : isGymPlayer ? '🤖 Lượt của HLV GYM...' : '🤖 Lượt của ĐỐI THỦ...' }}
    </div>

    <!-- ACTION BAR: KỸ NĂNG TẤN CÔNG -->
    <div class="mt-4">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <template v-for="slot in skillSlots" :key="slot.i">
          <button
            v-if="slot.skill"
            :disabled="isSkillDisabled(slot.skill)"
            @click="onUseSkill(slot.i)"
            class="group relative rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40 sm:p-3"
          >
            <span v-if="slot.skill.currentCd > 0" class="absolute right-1 top-1 rounded bg-red-500 px-1.5 text-[9px] font-bold text-white">CD: {{ slot.skill.currentCd }}</span>
            <div class="text-xs font-bold sm:text-sm"><RarityText :rarity="slot.skill.rarity">[{{ slot.skill.rarity }}] {{ slot.skill.name }}</RarityText></div>
            <div class="mt-0.5 text-[10px] text-amber-600">{{ skillValueText(slot.skill) }}</div>
            <div v-if="slot.skill.effect" class="mt-0.5 inline-block rounded px-1 py-px text-[9px] font-semibold" :class="effectClass(slot.skill.effect.type)">
              ✨ {{ effectText(slot.skill.effect) }}
            </div>
            <div class="text-[10px] text-slate-400">MP: {{ slot.skill.cost }}</div>
          </button>
          <div v-else class="rounded-xl border border-slate-200 bg-slate-50 p-2.5 opacity-60 sm:p-3">
            <div class="text-xs text-slate-400">🔒 Ô Kỹ Năng {{ slot.i + 1 }}</div>
            <div class="text-[10px] text-slate-400">Lvl {{ slot.lockedLevel }}</div>
          </div>
        </template>
      </div>

      <!-- SWITCH + BẮT POKEMON -->
      <div class="mt-3 flex flex-wrap justify-end gap-2">
        <button
          v-if="battle.mode === 'wild'"
          @click="openPokeballModal"
          :disabled="battle.currentTurnOwner !== 'player' || battle.isProcessingTurn"
          class="rounded-lg border border-red-300 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🔴 Bắt Pokémon
        </button>
        <button
          @click="openSwitch"
          :disabled="battle.currentTurnOwner !== 'player' || battle.isProcessingTurn"
          class="rounded-lg border border-sky-300 bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🔄 Đổi Pokémon
        </button>
      </div>
    </div>

    <!-- BATTLE LOG (collapsible) -->
    <div class="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button @click="logOpen = !logOpen" class="flex w-full items-center justify-between px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-slate-700">
        <span>📜 Nhật Ký Trận Đấu</span>
        <span>{{ logOpen ? '▲' : '▼' }}</span>
      </button>
      <div v-if="logOpen" class="max-h-40 overflow-y-auto border-t border-slate-200 p-3 text-xs text-slate-600">
        <div v-for="(entry, i) in battle.log" :key="i" class="py-0.5" v-html="entry"></div>
      </div>
    </div>

    <!-- SWITCH MODAL -->
    <Teleport to="body">
      <div v-if="switchOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="switchOpen = false">
        <div class="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-200 p-4">
            <h3 class="text-base font-bold text-sky-600">🔄 Đổi Pokémon Trong Trận</h3>
            <button class="text-2xl leading-none text-slate-400 hover:text-slate-600" @click="switchOpen = false">&times;</button>
          </div>
          <div class="flex-1 space-y-2 overflow-y-auto p-4">
            <div v-if="switchOptions.length === 0" class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-red-500">
              Không còn Pokémon nào khác còn sống để thay thế!
            </div>
            <button
              v-for="opt in switchOptions"
              :key="opt.idx"
              @click="onSwitch(opt.idx)"
              class="w-full rounded-xl border border-sky-300 bg-white p-3 text-left transition hover:bg-sky-50"
            >
              <div class="flex items-center gap-2 text-sm font-bold text-slate-800">
                <PokeSprite :name="opt.name" :type="store.team[opt.idx]?.type" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" :rounded="'rounded-full'" />
                <RarityText :rarity="opt.rarity" :label="opt.name" /> <span class="text-xs text-slate-500">(Lv.{{ opt.level }})</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded bg-slate-200">
                <div class="h-full bg-emerald-500 transition-all" :style="{ width: opt.hpPercent + '%' }"></div>
              </div>
              <small class="text-slate-500">HP: {{ opt.hp }}/{{ opt.maxHp }}</small>
            </button>
          </div>
          <button @click="switchOpen = false" class="bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200">Đóng</button>
        </div>
      </div>
    </Teleport>

    <!-- RESULT MODAL -->
    <Teleport to="body">
      <div v-if="battle.resultOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
        <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
          <h3 class="text-xl font-black" :class="battle.resultWin ? 'text-emerald-600' : 'text-red-500'">{{ resultBody.title }}</h3>
          <div class="mt-4 space-y-2 text-sm text-slate-600">
            <div v-for="(item, i) in resultBody.items" :key="i" class="rounded-lg bg-slate-50 p-2">
              {{ item }}
            </div>
          </div>
          <template v-if="isTowerWin">
            <div class="mt-5 flex gap-2">
              <button
                @click="onTowerQuit"
                class="flex-1 rounded-xl border border-amber-400 bg-amber-50 py-2.5 text-sm font-black text-amber-700 transition hover:bg-amber-100"
              >
                🪙 Rút Lui & Nhận Thưởng
              </button>
              <button
                @click="onTowerNext"
                class="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 py-2.5 text-sm font-black text-white transition hover:brightness-110"
              >
                🗼 Tầng Tiếp Theo ➜
              </button>
            </div>
            <p class="mt-2 text-[11px] text-slate-500">Rút Lui sẽ nhận toàn bộ rương thưởng. Tiếp tục nếu thua sẽ mất hết!</p>
          </template>
          <button
            v-else
            @click="battle.resultOpen = false; emit('close-result')"
            class="app-btn-primary mt-5 w-full py-2.5"
          >
            Quay Lại Bản Đồ
          </button>
        </div>
      </div>
    </Teleport>

    <!-- POKEBALL SELECTION MODAL (WILD ENCOUNTER) -->
    <Teleport to="body">
      <div v-if="pokeballModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="closePokeballModal">
        <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <h3 class="text-lg font-black text-slate-800 mb-4">🔴 Chọn Pokéball</h3>
          <p v-if="battle.enemyPoke" class="text-sm text-slate-600 mb-4">
            {{ battle.enemyPoke.name }} Lv.{{ battle.enemyPoke.level }} (HP: {{ Math.max(0, battle.enemyPoke.hp) }}/{{ battle.enemyPoke.maxHp }})
          </p>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button
              v-for="ball in pokeballCatalog"
              :key="ball.id"
              @click="onSelectPokeball(ball.id)"
              :disabled="ball.count <= 0"
              class="relative rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div class="flex items-center gap-3">
                <img :src="ball.icon" :alt="ball.name" class="h-10 w-10 shrink-0 object-contain" />
                <div class="flex-1">
                  <div class="font-bold text-slate-800">{{ ball.name }}</div>
                  <div class="text-xs text-slate-500">{{ ball.description }}</div>
                </div>
              </div>
              <div class="mt-2 text-right text-xs text-slate-500">
                <span v-if="ball.count > 0" class="font-bold text-emerald-600">✕{{ ball.count }}</span>
                <span v-else class="text-red-500">Hết</span>
              </div>
              <div v-if="ball.count > 0 && battle.enemyPoke" class="absolute bottom-3 right-3 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Tỷ lệ: {{ Math.round(getCaptureChance(battle.enemyPoke, ball.id) * 100) }}%
              </div>
            </button>
          </div>
          <button
            @click="runAway"
            class="w-full rounded-lg border border-slate-300 bg-slate-100 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            🏃 Bỏ Chạy
          </button>
        </div>
      </div>
    </Teleport>

    <!-- SKILL SELECT (LEVEL UP) -->
    <SkillSelectModal
      v-if="battle.skillQueue.length > 0"
      :open="true"
      :poke="battle.skillQueue[0].poke"
      :skillGroups="battle.skillQueue[0].skillGroups"
      :level="battle.skillQueue[0].level"
      :title="battle.skillQueue[0].title"
      @close="shiftSkillQueue()"
      @learned="shiftSkillQueue()"
    />
  </div>
</template>

<style scoped>
/* ===== ANIMATION CHIẾN ĐẤU ===== */
.fx-lunge-player {
  animation: fx-lunge-player 0.18s ease-out;
}
.fx-lunge-bot {
  animation: fx-lunge-bot 0.18s ease-out;
}
.fx-hit {
  animation: fx-hit 0.3s ease-out;
}
.fx-ko {
  animation: fx-ko 0.55s ease-in forwards;
}
.fx-appear {
  animation: fx-appear 0.35s ease-out;
}
.fx-glow {
  animation: fx-glow 0.5s ease-out;
}
.fx-burst {
  font-size: 56px;
  line-height: 1;
  animation: fx-burst 0.5s ease-out forwards;
}
.fx-num {
  font-size: 16px;
  animation: fx-float-up 0.9s ease-out forwards;
}
.fx-status-badge {
  animation: fx-status-pop 0.9s ease-out forwards;
}
.fx-shake-screen {
  animation: fx-shake-screen 0.4s ease-out;
}

.num-dmg {
  color: #ef4444;
}
.num-crit {
  color: #dc2626;
  font-size: 22px;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
}
.num-heal {
  color: #10b981;
}
.num-shield {
  color: #0ea5e9;
}
.num-dot {
  color: #f97316;
}
.num-reflect {
  color: #a855f7;
}

@keyframes fx-lunge-player {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(18px);
  }
  100% {
    transform: translateX(0);
  }
}
@keyframes fx-lunge-bot {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-18px);
  }
  100% {
    transform: translateX(0);
  }
}
@keyframes fx-hit {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  50% {
    transform: translateX(4px);
  }
  75% {
    transform: translateX(-2px);
  }
  100% {
    transform: translateX(0);
  }
}
@keyframes fx-ko {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(10px) scale(0.5);
    opacity: 0;
  }
}
@keyframes fx-appear {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes fx-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
  40% {
    box-shadow: 0 0 24px 8px rgba(16, 185, 129, 0.55);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}
@keyframes fx-burst {
  0% {
    transform: scale(0.3) rotate(-12deg);
    opacity: 0;
  }
  25% {
    transform: scale(1.25) rotate(6deg);
    opacity: 1;
  }
  60% {
    transform: scale(1.4) rotate(0deg);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.55) rotate(0deg);
    opacity: 0;
  }
}
@keyframes fx-float-up {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-36px);
    opacity: 0;
  }
}
@keyframes fx-status-pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  20% {
    transform: scale(1.1);
    opacity: 1;
  }
  80% {
    transform: scale(1);
    opacity: 1.
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
@keyframes fx-shake-screen {
  0%,
  100% {
    transform: translate(0, 0);
  }
  20% {
    transform: translate(-6px, 3px);
  }
  40% {
    transform: translate(6px, -3px);
  }
  60% {
    transform: translate(-4px, 2px);
  }
  80% {
    transform: translate(4px, -2px);
  }
}
</style>