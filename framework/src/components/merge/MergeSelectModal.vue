<script setup>
import { computed } from 'vue'
import { getMergeEligibleList, selectPokemonForMerge } from '../../game/merge.js'
import { store } from '../../game/store.js'
import RarityText from '../RarityText.vue'
import TypeBadge from '../poke/TypeBadge.vue'
import PokeSprite from '../PokeSprite.vue'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const eligibleList = computed(() => getMergeEligibleList())

function onSelect(item) {
  selectPokemonForMerge(item.originalIndex)
  store.mergeSearchQuery = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="emit('close')">
      <div class="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 class="text-base font-bold text-amber-600">🧬 Chọn Pokémon Phôi</h3>
          <button class="text-2xl leading-none text-slate-400 hover:text-slate-600" @click="emit('close')">&times;</button>
        </div>

        <div class="p-4">
          <input
            v-model="store.mergeSearchQuery"
            type="text"
            placeholder="🔍 Nhập tên Pokémon để tìm..."
            class="app-input w-full"
          />
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          <div v-if="eligibleList.length === 0" class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Không tìm thấy Pokémon phù hợp!
          </div>

          <button
            v-for="item in eligibleList"
            :key="item.originalIndex"
            @click="onSelect(item)"
            class="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:bg-slate-50"
          >
            <div class="flex min-w-0 items-center gap-2">
              <PokeSprite :name="item.pokemon.name" :type="item.pokemon.type" :size-class="'h-10 w-10'" :img-class="'h-10 w-10'" :rounded="'rounded-full'" />
              <div class="min-w-0">
                <RarityText :rarity="item.pokemon.rarity" :label="item.pokemon.name" />
                <span v-if="item.pokemon.vLevel > 0" class="ml-1 rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1 text-[10px] font-black text-white">
                  V{{ item.pokemon.vLevel }}
                </span>
                <span class="ml-1 text-xs text-slate-500">(Lv.{{ item.pokemon.level }})</span>
                <TypeBadge class="ml-2" :type="item.pokemon.type" />
              </div>
            </div>
            <small class="shrink-0 text-xs text-slate-500">
              HP:{{ item.pokemon.hp }}/{{ item.pokemon.maxHp }} | ATK:{{ item.pokemon.atk }} | SPD:{{ item.pokemon.speed }}
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
