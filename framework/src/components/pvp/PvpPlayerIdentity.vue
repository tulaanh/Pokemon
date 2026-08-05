<script setup>
import { computed } from 'vue'
import { store } from '../../game/store.js'
import { getPvpRank } from '../../game/pvp/rank.js'

const props = defineProps({
  player: { type: Object, default: () => ({}) },
  mine: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
const elo = computed(() => props.mine ? store.pvp.elo : props.player?.elo)
const level = computed(() => props.mine ? store.gameState.player.level : props.player?.level)
const name = computed(() => props.mine ? (store.gameState.player.playerName || 'Bạn') : (props.player?.name || 'Đối thủ'))
const rank = computed(() => getPvpRank(elo.value))
</script>

<template>
  <div class="flex min-w-0 items-center gap-2" :class="compact ? 'gap-1.5' : 'gap-3'">
    <div class="relative shrink-0">
      <div class="flex h-10 w-10 items-center justify-center rounded-full border-2" :class="rank.tone === 'amber' ? 'border-amber-400 bg-amber-50' : rank.tone === 'violet' ? 'border-violet-400 bg-violet-50' : rank.tone === 'blue' ? 'border-blue-400 bg-blue-50' : rank.tone === 'red' ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-50'">
        <img :src="rank.image" :alt="rank.name" class="h-6 w-6 object-contain" @error="$event.target.hidden = true; $event.target.nextElementSibling.hidden = false" />
        <span hidden class="flex h-6 w-6 items-center justify-center text-sm font-black" :class="rank.tone === 'amber' ? 'text-amber-600' : rank.tone === 'violet' ? 'text-violet-600' : rank.tone === 'blue' ? 'text-blue-600' : rank.tone === 'red' ? 'text-red-600' : 'text-slate-600'">{{ rank.icon }}</span>
      </div>
      <div class="absolute -bottom-1 -right-1 flex h-6 min-w-[22px] items-center justify-center rounded-full border-2 border-white bg-slate-900 px-1 text-[9px] font-black text-white shadow-md">{{ level ?? '–' }}</div>
    </div>
    <div class="min-w-0">
      <div class="truncate text-sm font-black leading-tight text-slate-900" :class="compact ? 'line-clamp-1' : 'line-clamp-2'">{{ name }}</div>
      <div class="text-[10px] font-bold text-slate-400">Lv.{{ level ?? '–' }} · {{ rank.shortName }}</div>
    </div>
  </div>
</template>