<script setup>
import { computed } from 'vue'
import { getPokedexPokemonList, getPokemonUniqueId, togglePokedex } from '../../game/inventory.js'
import { POKEDEX_LIMIT } from '../../game/data.js'
import { store, saveGameState } from '../../game/store.js'
import { showToast } from '../ui/toast.js'
import PokeDetailBody from './PokeDetailBody.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'view'])

const list = computed(() =>
  getPokedexPokemonList().sort((a, b) => b.pokemon.level - a.pokemon.level),
)

function onRemove(poke) {
  togglePokedex(getPokemonUniqueId(poke))
  saveGameState()
  showToast(`Đã gỡ ${poke.name} khỏi Pokédex!`, 'info')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      @click="emit('close')"
    >
      <div
        class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 class="text-base font-bold text-amber-600">📖 Pokédex — Pokémon Chủ Lực</h3>
          <button class="text-2xl leading-none text-slate-400 hover:text-slate-600" @click="emit('close')">&times;</button>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto p-4">
          <div v-if="list.length === 0" class="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Pokédex trống! Vào mục Đội Hình, nhấn ⭐ để thêm Pokémon chủ lực.
          </div>

          <div v-for="item in list" :key="getPokemonUniqueId(item.pokemon)" class="rounded-xl border-2 border-amber-400/60 bg-white p-4 shadow-sm">
            <PokeDetailBody :poke="item.pokemon" layout="card">
              <template #actions>
                <button
                  @click="onRemove(item.pokemon)"
                  title="Gỡ khỏi Pokédex"
                  class="rounded-lg border border-amber-400 bg-amber-50 px-2 py-1 text-sm transition hover:bg-amber-100"
                >
                  ⭐
                </button>
              </template>
              <template #footer>
                <div class="mt-4 text-center">
                  <button
                    @click="emit('view', item.pokemon)"
                    class="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2 text-xs font-bold text-white transition hover:brightness-110"
                  >
                    📋 Xem Chi Tiết
                  </button>
                </div>
              </template>
            </PokeDetailBody>
          </div>
        </div>

        <div class="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
          {{ store.gameState.pokedex.length }}/{{ POKEDEX_LIMIT }} Pokémon chủ lực
        </div>
      </div>
    </div>
  </Teleport>
</template>
