<script setup>
import { ref } from 'vue'
import { store, saveGameState } from '../game/store.js'
import { cheatSetLevel } from '../game/gacha.js'
import { showToast } from './ui/toast.js'

const open = ref(false)
const levelInput = ref(String(store.gameState.player.level))

const quickLevels = [1, 10, 25, 50, 90]

function applyLevel(val) {
  const v = cheatSetLevel(val === undefined ? levelInput.value : val)
  levelInput.value = String(v)
  showToast(`⚡ Đã điều chỉnh Cấp người chơi: Lv.${v}`, 'success')
}

function addGold(val) {
  store.gold += val
  saveGameState()
  showToast(`💰 Đã thêm ${val.toLocaleString()} Vàng`, 'success')
}

function addGems(val) {
  store.gems += val
  saveGameState()
  showToast(`💎 Đã thêm ${val.toLocaleString()} Gem`, 'success')
}
</script>

<template>
  <div class="border-b border-red-200 bg-red-50">
    <button
      @click="open = !open"
      class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 text-xs font-bold text-red-500 transition hover:text-red-600"
    >
      <span>🛠️ CHEAT CONSOLE (Thử Nghiệm)</span>
      <span>{{ open ? '▲ Thu Lại' : '▼ Mở Ra' }}</span>
    </button>

    <div v-if="open" class="mx-auto max-w-6xl px-4 pb-4">
      <div class="rounded-xl border border-red-200 bg-white p-4">
        <div class="flex flex-wrap items-center gap-3">
          <!-- CẤP NGƯỜI CHƠI -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-600">Cấp HLV (Lv):</span>
            <input
              v-model="levelInput"
              type="number"
              min="1"
              max="100"
              class="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-800"
            />
            <button @click="applyLevel()" class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200">Áp dụng</button>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-500">Nhanh:</span>
            <button
              v-for="lv in quickLevels"
              :key="lv"
              @click="applyLevel(lv)"
              class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
            >Lv {{ lv }}</button>
          </div>

          <!-- VÀNG & GEM -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-600">💰 Vàng:</span>
            <button @click="addGold(100000)" class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200">+100.000</button>
            <button @click="addGold(1000000)" class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200">+1.000.000</button>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-600">💎 Gem:</span>
            <button @click="addGems(10000)" class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-200">+10.000</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
