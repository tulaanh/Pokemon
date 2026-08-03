<script setup>
import { computed } from 'vue'
import { store } from '../../game/store.js'
import { getCandyUsableList, isCandyCapped, getTrainerLevel, LEVEL_CAP } from '../../game/shop.js'
import RarityText from '../RarityText.vue'
import TypeBadge from '../poke/TypeBadge.vue'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'use'])

const usableList = computed(() => getCandyUsableList())

function onUse(idx) {
  emit('use', idx)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="emit('close')">
      <div class="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 class="text-base font-bold text-purple-600">🍬 Chọn Pokémon Để Dùng Kẹo</h3>
          <button class="text-2xl leading-none text-slate-400 hover:text-slate-600" @click="emit('close')">&times;</button>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto p-4">
          <div v-if="store.team.length === 0" class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Chưa có Pokémon nào!
          </div>

          <button
            v-for="item in usableList"
            :key="item.idx"
            :disabled="isCandyCapped(item.pokemon)"
            @click="onUse(item.idx)"
            class="flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition"
            :class="
              isCandyCapped(item.pokemon)
                ? 'cursor-not-allowed border-red-300 bg-slate-50 opacity-50'
                : 'cursor-pointer border-emerald-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/40'
            "
          >
            <div class="min-w-0">
              <RarityText :rarity="item.pokemon.rarity" :label="item.pokemon.name" />
              <span v-if="item.pokemon.vLevel > 0" class="ml-1 rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1 text-[10px] font-black text-white">
                V{{ item.pokemon.vLevel }}
              </span>
              <span class="ml-1 text-xs text-slate-500">(Lv.{{ item.pokemon.level }})</span>
              <span v-if="isCandyCapped(item.pokemon)" class="text-[11px] font-bold text-red-500">
                (TRẦN Lv.{{ item.pokemon.level >= LEVEL_CAP ? LEVEL_CAP : getTrainerLevel() }})
              </span>
              <TypeBadge class="ml-2" :type="item.pokemon.type" />
            </div>
            <small class="shrink-0 text-xs text-slate-500">
              HP:{{ item.pokemon.maxHp }} | ATK:{{ item.pokemon.atk }} | SPD:{{ item.pokemon.speed }}
            </small>
          </button>
        </div>

        <button @click="emit('close')" class="bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200">
          Đóng
        </button>
      </div>
    </div>
  </Teleport>
</template>
