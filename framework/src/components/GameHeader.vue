<script setup>
import { computed } from 'vue'
import { store, saveGameState, resetGameState } from '../game/store.js'
import { getPlayerNextLevelExp } from '../game/stats.js'
import { showToast, confirmModal } from './ui/toast.js'
import { toggleMusic } from '../game/audio.js'
import { openSettings } from './ui/settingsModal.js'

const player = computed(() => store.gameState.player)
const musicOn = computed(() => store.settings.musicEnabled)

const expPercent = computed(() => {
  const next = getPlayerNextLevelExp(player.value.level)
  return Math.min(100, Math.max(0, (player.value.playerExp / next) * 100))
})

const expText = computed(
  () => `${player.value.playerExp.toLocaleString('en-US')} / ${getPlayerNextLevelExp(player.value.level).toLocaleString('en-US')} EXP`,
)

async function onSave() {
  saveGameState()
  showToast('Đã lưu tiến trình thành công!', 'success')
}

async function onReset() {
  const ok = await confirmModal('Bạn có chắc chắn muốn xóa toàn bộ tiến trình để chơi lại từ đầu?', {
    title: '🔄 Reset Game',
    okText: 'Xóa hết',
    danger: true,
  })
  if (ok) resetGameState()
}
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div class="mx-auto max-w-6xl px-4 py-3">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-fuchsia-500 text-xl shadow-md shadow-fuchsia-500/30">
            👤
          </div>
          <div>
            <div class="text-base font-bold text-slate-800">{{ player.playerName || 'Player 1' }}</div>
            <div class="text-xs font-semibold text-amber-600">Lv. {{ player.level }}</div>
          </div>
        </div>

        <div class="hidden flex-1 items-center gap-2 px-4 sm:flex">
          <span class="whitespace-nowrap text-xs font-medium text-slate-500">⚡ Kinh Nghiệm</span>
          <div class="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
              :style="{ width: expPercent + '%' }"
            ></div>
          </div>
          <span class="whitespace-nowrap text-xs text-slate-500">{{ expText }}</span>
        </div>

        <div class="flex items-center gap-2">
          <div class="app-tag" title="Gem">
            <span>💎</span>
            <span class="text-sm font-semibold text-sky-600">{{ store.gems.toLocaleString('en-US') }}</span>
          </div>
          <div class="app-tag" title="Vàng">
            <span>💰</span>
            <span class="text-sm font-semibold text-amber-600">{{ store.gold.toLocaleString('en-US') }}</span>
          </div>
          <div class="app-tag" title="PokePoint">
            <span>🎟️</span>
            <span class="text-sm font-semibold text-fuchsia-600">{{ player.pokePoint.toLocaleString('en-US') }}</span>
          </div>
          <div class="app-tag" title="PokeGacha">
            <span>🎫</span>
            <span class="text-sm font-semibold text-amber-600">{{ player.pokeGacha.toLocaleString('en-US') }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="toggleMusic()"
            :title="musicOn ? 'Tắt nhạc' : 'Bật nhạc'"
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
            :class="musicOn ? 'border-violet-300 bg-violet-50 text-violet-600 hover:bg-violet-100' : 'border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200'"
          >
            {{ musicOn ? '🎵 Nhạc: Bật' : '🔇 Nhạc: Tắt' }}
          </button>
          <button
            @click="openSettings()"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            title="Cài đặt"
          >
            ⚙️ Cài Đặt
          </button>
          <button
            @click="onSave"
            class="rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20"
          >
            💾 Lưu Game
          </button>
          <button
            @click="onReset"
            class="rounded-lg border border-red-400 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/20"
          >
            🔄 Reset Game
          </button>
        </div>
      </div>

      <!-- EXP bar (mobile) -->
      <div class="flex items-center gap-2 pb-1 sm:hidden">
        <span class="whitespace-nowrap text-xs font-medium text-slate-500">⚡ Kinh Nghiệm</span>
        <div class="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            class="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
            :style="{ width: expPercent + '%' }"
          ></div>
        </div>
        <span class="whitespace-nowrap text-xs text-slate-500">{{ expText }}</span>
      </div>
    </div>
  </header>
</template>
