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
    <div class="flex shrink-0 items-center justify-center rounded-full bg-slate-100 p-1" :title="rank.name">
      <img :src="rank.image" :alt="`Huy hiệu ${rank.name}`" class="h-9 w-9 object-contain" @error="$event.target.hidden = true; $event.target.nextElementSibling.hidden = false" />
      <span hidden class="flex h-9 w-9 items-center justify-center text-lg font-black text-slate-600">{{ rank.icon }}</span>
    </div>
    <div class="min-w-0 text-left">
      <div class="break-words text-sm font-black leading-tight text-slate-900" :class="compact ? 'line-clamp-1' : 'line-clamp-2'">{{ name }}</div>
      <div class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold text-slate-500">
        <span>Lv.{{ level || '?' }}</span><span>·</span><span class="text-indigo-600">{{ rank.shortName }}</span><span>·</span><span>ELO {{ elo ?? '?' }}</span>
      </div>
    </div>
  </div>
</template>