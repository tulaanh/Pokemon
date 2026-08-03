<script setup>
import { computed } from 'vue'
import { store } from '../../game/store.js'
import { getStoneEvolvableList } from '../../game/shop.js'
import RarityText from '../RarityText.vue'
import TypeBadge from '../poke/TypeBadge.vue'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'use'])

const evolvableList = computed(() => getStoneEvolvableList())

function onUse(idx, branch) {
  emit('use', { idx, branch })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="emit('close')">
      <div class="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 class="text-base font-bold text-amber-600">💎 Chọn Pokémon Để Dùng Đá Tiến Hóa</h3>
          <button class="text-2xl leading-none text-slate-400 hover:text-slate-600" @click="emit('close')">&times;</button>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto p-4">
          <div v-if="evolvableList.length === 0" class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Chưa có Pokémon nào có thể tiến hóa bằng đá!
            <div class="mt-1 text-xs">Gợi ý: Eevee, Vulpix, Growlithe, Magikarp, Larvitar.</div>
          </div>

          <div
            v-for="item in evolvableList"
            :key="item.idx"
            class="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <RarityText :rarity="item.pokemon.rarity" :label="item.pokemon.name" />
                <span v-if="item.pokemon.vLevel > 0" class="ml-1 rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1 text-[10px] font-black text-white">
                  V{{ item.pokemon.vLevel }}
                </span>
                <span class="ml-1 text-xs text-slate-500">(Lv.{{ item.pokemon.level }})</span>
                <TypeBadge class="ml-2" :type="item.pokemon.type" />
              </div>
              <small class="shrink-0 text-xs text-slate-500">
                HP:{{ item.pokemon.maxHp }} | ATK:{{ item.pokemon.atk }} | SPD:{{ item.pokemon.speed }}
              </small>
            </div>

            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="b in item.branches"
                :key="b.evo.next"
                :disabled="!b.hasStone"
                @click="onUse(item.idx, b.evo)"
                class="rounded-lg border px-2.5 py-1 text-xs font-bold transition"
                :class="
                  b.hasStone
                    ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                "
              >
                {{ b.stone ? b.stone.emoji : '💎' }} {{ b.evo.next }}
                <span v-if="b.stone" class="ml-0.5 text-[10px] opacity-75">({{ store.inventory[b.stone.id] || 0 }} đá)</span>
              </button>
            </div>
          </div>
        </div>

        <button @click="emit('close')" class="bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200">
          Đóng
        </button>
      </div>
    </div>
  </Teleport>
</template>
