<script setup>
import { computed } from 'vue'
import { settingsModalState, closeSettings } from './settingsModal.js'
import { musicEnabled, setMusicEnabled, setMusicVolume } from '../../game/audio.js'
import { store, saveGameState, resetProgress } from '../../game/store.js'
import { CHARACTERS, getCharacter } from '../../game/characters.js'
import { showToast, confirmModal } from './toast.js'

const musicOn = computed(() => musicEnabled())
const volume = computed(() => Math.round((store.settings.musicVolume ?? 0.5) * 100))
const currentCharacter = computed(() => store.gameState.player.character || 'red')

function onVolume(e) {
  setMusicVolume(Number(e.target.value) / 100)
}

function selectCharacter(id) {
  if (!CHARACTERS[id] || currentCharacter.value === id) return
  store.gameState.player.character = id
  saveGameState()
  showToast(`👤 Đã chọn nhân vật ${getCharacter(id).label} (${getCharacter(id).name})!`, 'success')
}

async function onResetProgress() {
  const ok = await confirmModal('Xóa toàn bộ tiến trình và bắt đầu lại từ đầu? Cài đặt nhạc sẽ được giữ nguyên.', {
    title: '🔄 Reset Tiến Trình',
    okText: 'Xóa tiến trình',
    danger: true,
  })
  if (ok) {
    resetProgress()
    showToast('Đã reset tiến trình!', 'success')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="settingsModalState.open"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      @click.self="closeSettings()"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">⚙️ Cài Đặt</h3>
          <button
            @click="closeSettings()"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Đóng"
          >
            ×
          </button>
        </div>

        <!-- BẬT/TẮT NHẠC -->
        <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <div class="text-sm font-bold text-slate-700">🎵 Nhạc nền</div>
            <div class="text-xs text-slate-400">{{ musicOn ? 'Đang bật' : 'Đang tắt' }}</div>
          </div>
          <button
            @click="setMusicEnabled(!musicOn)"
            class="relative flex h-6 w-12 items-center rounded-full transition-colors duration-200"
            :class="musicOn ? 'bg-emerald-500' : 'bg-slate-300'"
            :aria-pressed="musicOn"
            role="switch"
          >
             <span
               class="h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
               :class="musicOn ? 'translate-x-6' : 'translate-x-0'"
             ></span>
           </button>
        </div>

        <!-- ÂM LƯỢNG -->
        <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-bold text-slate-700">🔊 Âm lượng</span>
            <span class="text-xs font-semibold text-slate-400">{{ volume }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="volume"
            :disabled="!musicOn"
            @input="onVolume"
            class="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <!-- CHỌN NHÂN VẬT (NAM / NỮ) -->
        <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-bold text-slate-700">👤 Nhân Vật</span>
            <span class="text-xs font-semibold text-slate-400">{{ getCharacter(currentCharacter).label }}</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="char in CHARACTERS"
              :key="char.id"
              @click="selectCharacter(char.id)"
              class="flex flex-col items-center gap-1.5 rounded-xl border-2 bg-white px-3 py-3 transition"
              :class="currentCharacter === char.id
                ? 'border-amber-400 bg-amber-50 shadow-md'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
            >
              <span
                class="block h-16 w-8"
                style="background-repeat: no-repeat; image-rendering: pixelated"
                :style="{ backgroundImage: `url('${char.sprite}')`, backgroundSize: '288px 64px', backgroundPosition: '0 0' }"
              ></span>
              <span class="text-xs font-bold" :class="currentCharacter === char.id ? 'text-amber-700' : 'text-slate-600'">
                {{ char.emoji }} {{ char.label }}
              </span>
            </button>
          </div>
          <p class="mt-2 text-[11px] text-slate-400">Nhân vật sẽ được đổi ngay trên bản đồ sau khi chọn.</p>
        </div>

        <button
          @click="onResetProgress"
          class="mt-4 w-full rounded-xl border border-red-300 bg-red-500/10 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-500/20"
        >
          🔄 Reset Tiến Trình
        </button>

        <p class="mt-4 text-[11px] leading-snug text-slate-400">
          Cài đặt được lưu tự động và giữ nguyên khi tải lại trang.
        </p>
      </div>
    </div>
  </Teleport>
</template>
