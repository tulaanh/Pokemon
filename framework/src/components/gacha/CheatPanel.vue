<script setup>
import { ref } from 'vue'
import { cheatAddResource, cheatSetLevel, cheatResetAllResources } from '../../game/gacha.js'
import { showToast, confirmModal } from '../ui/toast.js'

const levelInput = ref('1')

function applyLevel() {
  const val = cheatSetLevel(levelInput.value)
  showToast(`Đã điều chỉnh Cấp người chơi thành công: Lv.${val}`, 'success')
}

async function resetResources() {
  const ok = await confirmModal(
    'Xác nhận đặt lại tất cả tài nguyên Gacha về mặc định (PokePoint: 1000, PokeGacha: 0, Cấp người chơi: 1)?',
    { title: 'Reset Tài Nguyên', okText: 'Reset', danger: true },
  )
  if (ok) {
    cheatResetAllResources()
    showToast('Đã reset tài nguyên Gacha về mặc định!', 'success')
  }
}
</script>

<template>
  <div class="rounded-xl border border-red-300 bg-red-50/80 p-4">
    <h4 class="mb-3 flex items-center justify-between text-sm font-bold text-red-600">
      <span>🛠️ Bảng Điều Khiển Thử Nghiệm (Cheat / Test Tools)</span>
      <span class="text-[11px] font-normal text-slate-500">Dành cho lập trình viên & người chấm điểm</span>
    </h4>

    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-slate-600">PokePoint:</span>
        <button @click="cheatAddResource('pokePoint', 1000)" class="rounded-lg bg-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-300">+1.000 🎟️</button>
        <button @click="cheatAddResource('pokePoint', 10000)" class="rounded-lg bg-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-300">+10.000 🎟️</button>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-xs text-slate-600">PokeGacha:</span>
        <button @click="cheatAddResource('pokeGacha', 100)" class="rounded-lg bg-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-300">+100 🎫</button>
        <button @click="cheatAddResource('pokeGacha', 500)" class="rounded-lg bg-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-300">+500 🎫</button>
      </div>

      <div class="flex items-center gap-1.5">
        <span class="text-xs text-slate-600">Cấp người chơi (Lv):</span>
        <input
          v-model="levelInput"
          type="number"
          min="1"
          max="100"
          class="w-14 rounded border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-800"
        />
        <button @click="applyLevel" class="rounded-lg bg-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-300">Áp dụng</button>
      </div>

      <div class="ml-auto">
        <button @click="resetResources" class="rounded-lg bg-slate-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-600">
          Reset Tài Nguyên
        </button>
      </div>
    </div>
  </div>
</template>
