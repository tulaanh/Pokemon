<script setup>
import { ref, computed } from 'vue'
import { store, addPokemonToInventory, saveGameState } from '../../game/store.js'
import { STARTER_NAMES, STARTER_RARITY, STARTER_LEVEL, getStarterData, buildStarterPoke } from '../../game/onboarding.js'
import RarityText from '../RarityText.vue'
import StarterCard from '../StarterCard.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['complete'])

const step = ref('greet') // greet | name | choose | done
const lineIdx = ref(0)
const playerName = ref('')
const selectedStarter = ref(null)
const errorMessage = ref('')

const GREETING_LINES = [
  'Xin chào! Ta là Giáo sư Oak. Chào mừng cháu đến với thế giới Pokémon tuyệt vời!',
  'Trước khi bắt đầu hành trình, ta cần biết tên của cháu.',
]

const greetingLine = computed(() => GREETING_LINES[lineIdx.value])
const isLastGreeting = computed(() => lineIdx.value >= GREETING_LINES.length - 1)

function nextGreeting() {
  if (!isLastGreeting.value) {
    lineIdx.value++
    return
  }
  step.value = 'name'
}

function confirmName() {
  if (!playerName.value.trim()) {
    errorMessage.value = 'Cháu hãy cho ta biết tên của cháu!'
    return
  }
  errorMessage.value = ''
  step.value = 'choose'
}

function selectStarter(name) {
  selectedStarter.value = name
  errorMessage.value = ''
}

function confirmStarter() {
  if (!selectedStarter.value) {
    errorMessage.value = 'Cháu hãy chọn 1 Pokémon khởi đầu!'
    return
  }
  step.value = 'done'
}

function finish() {
  const name = playerName.value.trim()
  const starterPoke = buildStarterPoke(selectedStarter.value)
  if (!starterPoke) return

  store.gameState.player.playerName = name
  store.gameState.player.hasCompletedFirstLogin = true
  addPokemonToInventory(starterPoke)
  saveGameState()
  emit('complete', { name, starterName: starterPoke.name })
}

const starterSpecies = computed(() => STARTER_NAMES.map((n) => getStarterData(n)).filter(Boolean))
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-slide-up">
        <!-- Header -->
        <div class="border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-amber-500 p-6 text-center">
          <h2 class="text-3xl font-bold text-white">👨‍🔬 Phòng Lab của Giáo sư Oak</h2>
          <p class="mt-1 text-emerald-50">Nhập tên và chọn Pokémon khởi đầu của cháu</p>
        </div>

        <!-- Body -->
        <div class="p-6">
          <!-- BƯỚC 1: HỘI THOẠI CHÀO MỪNG -->
          <div v-if="step === 'greet'" class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-xl">
                👨‍🔬
              </span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">{{ greetingLine }}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span v-for="(ln, i) in GREETING_LINES" :key="i" class="h-1.5 flex-1 rounded-full transition" :class="i <= lineIdx ? 'bg-amber-500' : 'bg-slate-200'"></span>
            </div>
            <button
              @click="nextGreeting"
              class="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-amber-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              {{ isLastGreeting ? 'Được rồi, để ta hỏi tên cháu ▸' : 'Tiếp tục ▸' }}
            </button>
          </div>

          <!-- BƯỚC 2: NHẬP TÊN -->
          <div v-else-if="step === 'name'" class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-xl">👨‍🔬</span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">
                Cháu tên là gì? Hãy nhập tên để ta biết cách gọi cháu!
              </p>
            </div>

            <label class="block mb-2 text-sm font-semibold text-slate-700">📝 Tên người chơi</label>
            <input
              v-model="playerName"
              @keyup.enter="confirmName"
              type="text"
              maxlength="20"
              placeholder="Nhập tên của cháu..."
              class="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none"
            />

            <div v-if="errorMessage" class="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm text-red-600">
              {{ errorMessage }}
            </div>

            <button
              @click="confirmName"
              :disabled="!playerName.trim()"
              class="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-amber-500 px-6 py-3 text-lg font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            >
              Tiếp tục ▸
            </button>
          </div>

          <!-- BƯỚC 3: CHỌN STARTER -->
          <div v-else-if="step === 'choose'" class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-xl">👨‍🔬</span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">
                {{ playerName.trim() }}, trên bàn là 3 Pokéballs chứa 3 Pokémon tuyệt vời. Hãy chọn cho mình 1 người bạn đồng hành!
              </p>
            </div>

            <p class="text-center text-sm text-slate-500">
              Mỗi Pokémon đều có độ hiếm <RarityText :rarity="STARTER_RARITY" :label="STARTER_RARITY.name" /> và cấp độ {{ STARTER_LEVEL }}
            </p>

            <div class="grid grid-cols-3 gap-4">
              <StarterCard
                v-for="name in STARTER_NAMES"
                :key="name"
                :name="name"
                :species="getStarterData(name)"
                :rarity="STARTER_RARITY"
                :selected="selectedStarter === name"
                @click="selectStarter"
              />
            </div>

            <div v-if="errorMessage" class="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm text-red-600">
              {{ errorMessage }}
            </div>

            <button
              @click="confirmStarter"
              :disabled="!selectedStarter"
              class="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-amber-500 px-6 py-3 text-lg font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            >
              Chọn {{ selectedStarter || '...' }} ▸
            </button>
          </div>

          <!-- BƯỚC 4: CHỐT -->
          <div v-else class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-xl">👨‍🔬</span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">
                Tuyệt vời! {{ playerName.trim() }}, {{ selectedStarter }} sẽ là người bạn đồng hành đầu tiên của cháu.
                Hãy yêu quý và chăm sóc nó thật tốt nhé. Thế giới Pokémon đang chờ đón cháu!
              </p>
            </div>

            <div class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
              <div class="text-sm font-bold text-amber-700">
                🎁 Bạn đã nhận <RarityText :rarity="STARTER_RARITY" :label="selectedStarter" /> (Legendary — Cấp {{ STARTER_LEVEL }})
              </div>
              <div class="mt-1 text-xs text-amber-600">Giờ hãy bước ra thị trấn để bắt đầu hành trình nhé!</div>
            </div>

            <button
              @click="finish"
              class="w-full rounded-lg bg-gradient-to-r from-amber-500 to-fuchsia-600 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              🚀 Bắt Đầu Hành Trình
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
