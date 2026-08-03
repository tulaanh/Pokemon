<script setup>
import { computed } from 'vue'
import { store } from '../../game/store.js'
import { getPokemonUniqueId, getSellPrice, getGemSellPrice, canSellForGems, sellPokemon } from '../../game/inventory.js'
import { showToast, confirmModal } from '../ui/toast.js'
import PokeDetailBody from './PokeDetailBody.vue'

const props = defineProps({
  poke: { type: Object, default: null },
})

const emit = defineEmits(['close', 'sold'])

const goldPrice = computed(() => (props.poke ? getSellPrice(props.poke) : 0))
const gemPrice = computed(() => (props.poke ? getGemSellPrice(props.poke) : 0))
const sellGems = computed(() => (props.poke ? canSellForGems(props.poke) : false))
const canSell = computed(() => store.team.length > 1)

async function onSellGold() {
  if (!props.poke) return
  const ok = await confirmModal(`Bán ${props.poke.name} lấy ${goldPrice.value.toLocaleString('en-US')} Vàng?`, {
    title: 'Bán Pokémon',
    okText: 'Bán',
    danger: true,
  })
  if (!ok) return
  const result = sellPokemon(getPokemonUniqueId(props.poke), 'gold')
  if (result.ok) emit('sold')
  else showToast(result.message, 'error')
}

async function onSellGems() {
  if (!props.poke) return
  const ok = await confirmModal(`Bán ${props.poke.name} lấy ${gemPrice.value.toLocaleString('en-US')} Gem?`, {
    title: 'Bán Pokémon',
    okText: 'Bán',
    danger: true,
  })
  if (!ok) return
  const result = sellPokemon(getPokemonUniqueId(props.poke), 'gems')
  if (result.ok) emit('sold')
  else showToast(result.message, 'error')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="poke"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      @click="emit('close')"
    >
      <div
        class="app-modal max-w-md"
        @click.stop
      >
        <div class="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 class="text-base font-bold text-amber-600">📋 Chi Tiết Pokémon</h3>
          <button class="text-2xl leading-none text-slate-400 hover:text-slate-600" @click="emit('close')">&times;</button>
        </div>

        <PokeDetailBody :poke="poke" layout="modal">
          <template #footer>
            <div class="mt-5 space-y-2.5 text-center">
              <div v-if="canSell" class="grid gap-2.5">
                <template v-if="sellGems">
                  <button
                    @click="onSellGems"
                    class="w-full rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                  >
                    BÁN LẤY GEM 💎 {{ gemPrice.toLocaleString('en-US') }}
                  </button>
                  <button
                    @click="onSellGold"
                    class="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                  >
                    BÁN LẤY VÀNG 💰 {{ goldPrice.toLocaleString('en-US') }}
                  </button>
                </template>
                <button
                  v-else
                  @click="onSellGold"
                  class="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                >
                  BÁN 💰 {{ goldPrice.toLocaleString('en-US') }} Vàng
                </button>
              </div>
              <button
                @click="emit('close')"
                class="w-full rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
              >
                ĐÓNG
              </button>
            </div>
          </template>
        </PokeDetailBody>
      </div>
    </div>
  </Teleport>
</template>
