<script setup>
import { ref } from 'vue'
import { store } from '../game/store.js'
import { buyRareCandy, RARE_CANDY_PRICE, buyEvolutionStone, getStoneCatalog, buyPokeball, getPokeballCatalog } from '../game/shop.js'
import { showToast } from '../components/ui/toast.js'

const feedback = ref('')
const stoneCatalog = ref(getStoneCatalog())
const pokeballCatalog = ref(getPokeballCatalog())

function onBuyCandy(amount) {
  const result = buyRareCandy(amount)
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  feedback.value = result.message
  showToast(`Đã mua ${amount} Kẹo Kinh Nghiệm!`, 'success')
  setTimeout(() => (feedback.value = ''), 4000)
}

function onBuyStone(stoneId) {
  const result = buyEvolutionStone(stoneId, 1)
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  stoneCatalog.value = getStoneCatalog()
  feedback.value = result.message
  showToast(`Đã mua ${result.amount} ${result.stone?.name || 'Đá Tiến Hóa'}!`, 'success')
  setTimeout(() => (feedback.value = ''), 4000)
}

function onBuyPokeball(ballId, amount = 1) {
  const result = buyPokeball(ballId, amount)
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  pokeballCatalog.value = getPokeballCatalog()
  feedback.value = result.message
  showToast(`Đã mua ${amount} ${result.ball?.name || 'Pokéball'}!`, 'success')
  setTimeout(() => (feedback.value = ''), 4000)
}

</script>

<template>
  <div class="mx-auto max-w-lg">
    <div class="app-card p-6">
      <h3 class="text-center text-lg font-bold text-slate-800">🛒 Cửa Hàng Vật Phẩm</h3>

      <!-- KẸO KINH NGHIỆM -->
      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 class="text-lg font-bold text-purple-600">🍬 Kẹo Kinh Nghiệm (Rare Candy)</h4>
        <p class="my-2 text-xs text-slate-500">Tăng ngay <b class="text-slate-700">1 cấp</b> cho Pokémon chọn lựa (Cấp < 90).</p>
        <p class="text-sm text-slate-700">Trong kho có: <b class="text-purple-600">{{ store.inventory.candy }}</b> viên</p>
        <p class="my-3 text-base font-bold text-amber-600">Giá: {{ RARE_CANDY_PRICE.toLocaleString() }} 💰 Vàng / viên</p>

        <div class="flex justify-center gap-2">
          <button
            @click="onBuyCandy(1)"
            class="rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-2 text-xs font-black text-white transition hover:brightness-110"
          >
            Mua x1
          </button>
          <button
            @click="onBuyCandy(5)"
            class="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-4 py-2 text-xs font-black text-white transition hover:brightness-110"
          >
            Mua x5
          </button>
          <button
            @click="onBuyCandy(10)"
            class="rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 px-4 py-2 text-xs font-black text-white transition hover:brightness-110"
          >
            Mua x10
          </button>
        </div>
      </div>

      <!-- ĐÁ TIẾN HÓA -->
      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 class="text-lg font-bold text-amber-600">💎 Đá Tiến Hóa (Evolution Stones)</h4>
        <p class="my-2 text-xs text-slate-500">Dùng trong <b class="text-slate-700">Kho Đồ</b> để tiến hóa các nhánh đá (Eevee, Vulpix, Magikarp, Larvitar...).</p>

        <div class="mt-3 space-y-2">
          <div
            v-for="stone in stoneCatalog"
            :key="stone.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div class="min-w-0">
              <div class="text-sm font-bold text-slate-800">{{ stone.emoji }} {{ stone.name }}</div>
              <div class="text-[11px] text-slate-500">{{ stone.description }}</div>
              <div class="mt-0.5 text-xs text-slate-600">
                Trong kho: <b class="text-amber-600">{{ stone.count }}</b> | Giá: <b class="text-amber-600">{{ stone.price.toLocaleString() }} 💰</b>
              </div>
            </div>
            <button
              @click="onBuyStone(stone.id)"
              :disabled="store.gold < stone.price"
              class="shrink-0 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mua x1
            </button>
          </div>
        </div>
      </div>

      <!-- POKÉBALL -->
      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 class="text-lg font-bold text-red-600">🔴 Pokéball</h4>
        <p class="my-2 text-xs text-slate-500">Dùng để bắt Pokémon hoang dã trên bản đồ. Các loại bóng tốt hơn có tỷ lệ bắt cao hơn.</p>

        <div class="mt-3 space-y-2">
          <div
            v-for="ball in pokeballCatalog"
            :key="ball.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <div class="min-w-0">
              <div class="text-sm font-bold text-slate-800">{{ ball.emoji }} {{ ball.name }}</div>
              <div class="text-[11px] text-slate-500">{{ ball.description }}</div>
              <div class="mt-0.5 text-xs text-slate-600">
                Trong kho: <b class="text-red-600">{{ ball.count }}</b> | Giá: <b class="text-red-600">{{ ball.price.toLocaleString() }} 💰</b>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="onBuyPokeball(ball.id, 1)"
                :disabled="store.gold < ball.price"
                class="shrink-0 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-3 py-1.5 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mua x1
              </button>
              <button
                @click="onBuyPokeball(ball.id, 5)"
                :disabled="store.gold < ball.price * 5"
                class="shrink-0 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mua x5
              </button>
              <button
                @click="onBuyPokeball(ball.id, 10)"
                :disabled="store.gold < ball.price * 10"
                class="shrink-0 rounded-lg bg-gradient-to-r from-purple-500 to-violet-600 px-3 py-1.5 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mua x10
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="feedback" class="mt-3 rounded-xl border border-emerald-400/60 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-600">
        {{ feedback }}
      </div>
    </div>
  </div>
</template>