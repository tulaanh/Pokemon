<script setup>
import { ref } from 'vue'
import { store, saveGameState } from '../game/store.js'
import { CHARACTERS, getCharacter } from '../game/characters.js'
import StoryIntro from './StoryIntro.vue'

const emit = defineEmits(['start'])

const step = ref('menu') // 'menu' → chọn nhân vật → vào game
const selected = ref(store.gameState.player.character || 'red')
const introOpen = ref(false)

function openCharacterSelect() {
  step.value = 'character'
}

function confirm() {
  store.gameState.player.character = selected.value
  saveGameState()
  // Lần đầu vào game: chạy cốt truyện mở đầu trước, sau đó mới vào bản đồ
  if (!store.gameState.player.hasSeenIntro) {
    introOpen.value = true
    return
  }
  emit('start')
}

function onIntroDone() {
  introOpen.value = false
  store.gameState.player.hasSeenIntro = true
  saveGameState()
  emit('start')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col items-center justify-end overflow-hidden">
    <div
      class="absolute inset-0 bg-cover bg-center"
      style="background-image: url('/images/hinh_nen/main_screen.png');"
    ></div>
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>

    <!-- BƯỚC 1: MÀN HÌNH MỞ ĐẦU -->
    <div v-if="step === 'menu'" class="relative z-10 mb-[12vh] flex flex-col items-center">
      <button
        @click="openCharacterSelect"
        class="animate-pulse rounded-2xl bg-gradient-to-r from-amber-500 to-fuchsia-600 px-12 py-4 text-xl font-black tracking-widest text-white shadow-xl shadow-fuchsia-900/40 transition hover:scale-105 hover:brightness-110"
      >
        ▶ BẮT ĐẦU
      </button>
    </div>

    <!-- BƯỚC 2: CHỌN NHÂN VẬT (NAM / NỮ) -->
    <div v-else class="relative z-10 mb-[10vh] w-full max-w-md px-6">
      <div class="rounded-2xl border border-white/20 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
        <h2 class="text-center text-lg font-black tracking-wide text-white">👤 CHỌN NHÂN VẬT</h2>
        <p class="mt-1 text-center text-xs text-slate-300">Chọn giới tính cho huấn luyện viên của bạn</p>

        <div class="mt-5 grid grid-cols-2 gap-4">
          <button
            v-for="char in CHARACTERS"
            :key="char.id"
            @click="selected = char.id"
            class="flex flex-col items-center gap-2 rounded-xl border-2 bg-white/10 py-4 transition"
            :class="selected === char.id
              ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-500/20'
              : 'border-white/20 hover:border-white/40 hover:bg-white/15'"
          >
            <span
              class="block h-24 w-12"
              style="background-repeat: no-repeat; image-rendering: pixelated"
              :style="{ backgroundImage: `url('${char.sprite}')`, backgroundSize: '432px 96px', backgroundPosition: '0 0' }"
            ></span>
            <span class="text-sm font-black" :class="selected === char.id ? 'text-amber-300' : 'text-white'">
              {{ char.emoji }} {{ char.label }}
            </span>
          </button>
        </div>

        <div class="mt-5 flex gap-3">
          <button
            @click="step = 'menu'"
            class="flex-1 rounded-xl border border-white/30 bg-white/10 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Quay lại
          </button>
          <button
            @click="confirm"
            class="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 py-2.5 text-sm font-black tracking-wide text-white shadow-lg transition hover:brightness-110"
          >
            ✅ VÀO GAME
          </button>
        </div>
      </div>
    </div>

    <!-- CỐT TRUYỆN MỞ ĐẦU (lần đầu vào game) -->
    <StoryIntro :open="introOpen" @done="onIntroDone" />
  </div>
</template>
