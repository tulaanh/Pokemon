<script setup>
import { ref, computed, watch } from 'vue'
import { store } from '../../game/store.js'
import { addToPokedex } from '../../game/inventory.js'
import { POKEDEX_LIMIT } from '../../game/data.js'
import { setOnboardingStage, getOnboardingStage, STORY_STAGES } from '../../game/story.js'
import PokeSprite from '../PokeSprite.vue'
import TypeBadge from '../poke/TypeBadge.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'training', 'gotoCampaign'])

const step = ref('greet') // greet | pokedex | slides | final
const lineIdx = ref(0)
const slideIdx = ref(0)
const pokedexResult = ref(null)

const GREETING_LINES = [
  'Chào mừng đến với Bệnh viện Pokémon! Cháu là tân Huấn luyện viên của Giáo sư Oak đúng không?',
  'Trước khi bước ra thế giới rộng lớn, để ta đăng ký Pokémon khởi đầu của cháu vào Pokédex đã nhé!',
]

const greetingLine = computed(() => GREETING_LINES[lineIdx.value])
const isLastGreeting = computed(() => lineIdx.value >= GREETING_LINES.length - 1)

// Pokémon khởi đầu (id 'starter-...' do Oak tạo) — fallback theo tên starter
const starter = computed(
  () =>
    store.team.find((p) => p && String(p.id).startsWith('starter-')) ||
    store.team.find((p) => p && ['Bulbasaur', 'Charmander', 'Squirtle'].includes(p.name)) ||
    store.team[0] ||
    null,
)

// Slides hướng dẫn chiến đấu (đúng cơ chế thật trong game)
const SLIDES = [
  {
    icon: '🔁',
    title: 'Trận đấu theo lượt',
    text: 'Hai bên đánh xen kẽ nhau. Chỉ số Tốc Độ (SPD) chỉ quyết định AI ĐI TRƯỚC khi một Pokémon vừa xuất trận — nếu tốc độ bằng nhau, chọn ngẫu nhiên 50/50.',
  },
  {
    icon: '📊',
    title: 'Chỉ số & Kỹ năng',
    text: 'Mỗi Pokémon có HP, MP, ATK, DEF, SPD. Kỹ năng tốn MP và có hồi chiêu (CD). Hãy cân nhắc quản lý MP và thời điểm dùng kỹ năng mạnh!',
  },
  {
    icon: '🧮',
    title: 'Công thức sát thương',
    text: '(ATK + Sức mạnh chiêu) × [100/(100+DEF)] × hệ số hệ × Báo kích (15% cơ hội, ×1.5) × ngẫu nhiên (0.9–1.1).',
  },
  {
    icon: '⚔️',
    title: 'Bảng hệ số hệ',
    text: 'Lửa 🔥 thắng Cỏ 🌿, Nước 💧 thắng Lửa 🔥, Cỏ 🌿 thắng Nước 💧, Điện ⚡ thắng Nước 💧, Đá 🪨 thắng Lửa/Điện. Siêu hiệu quả ×1.5, kháng ×0.75 / ×0.5.',
  },
  {
    icon: '🛡️',
    title: 'Khiên, hồi máu & sát thương chuẩn',
    text: 'Khiên hấp thụ sát thương trước HP. Kỹ năng hồi phục phục hồi HP. Sát thương chuẩn (true damage) BỎ QUA DEF của đối thủ!',
  },
  {
    icon: '✨',
    title: 'Trạng thái đặc biệt',
    text: 'Choáng khiến mất 1 lượt. DoT (Bỏng, Sốc điện, Độc, Chảy máu) gây sát thương đầu lượt. Buff/Debuff ATK-DEF kéo dài nhiều lượt.',
  },
  {
    icon: '🎒',
    title: 'Đội hình & Cấp độ',
    text: 'Mang theo tối đa 3 Pokémon, có thể đổi trong trận. Cấp độ của Pokémon không thể vượt quá cấp độ Huấn luyện viên của cháu!',
  },
]

const currentSlide = computed(() => SLIDES[slideIdx.value])
const isLastSlide = computed(() => slideIdx.value >= SLIDES.length - 1)

// Reset hội thoại mỗi lần mở (theo tiến trình cốt truyện)
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    pokedexResult.value = null
    const stage = getOnboardingStage()
    if (stage >= STORY_STAGES.HOSPITAL) {
      // Đã đăng ký Pokédex rồi → vào thẳng slides
      step.value = 'slides'
      slideIdx.value = 0
    } else {
      step.value = 'greet'
      lineIdx.value = 0
    }
  },
)

// Khi bước vào màn đăng ký → tự động thêm starter vào Pokédex
watch(step, (s) => {
  if (s === 'pokedex') doRegister()
})

function nextGreeting() {
  if (!isLastGreeting.value) {
    lineIdx.value++
    return
  }
  step.value = 'pokedex'
}

function doRegister() {
  if (pokedexResult.value) return
  if (!starter.value) {
    pokedexResult.value = { ok: false, message: '⚠️ Không tìm thấy Pokémon khởi đầu trong đội hình!' }
    return
  }
  const res = addToPokedex(starter.value.id)
  if (res.added || res.already) {
    setOnboardingStage(STORY_STAGES.HOSPITAL)
    pokedexResult.value = { ok: true, message: `${starter.value.name} đã được ghi nhận vào Pokédex!` }
  } else if (res.full) {
    pokedexResult.value = { ok: false, message: `⚠️ Pokédex đã đầy (${res.count}/${POKEDEX_LIMIT}) — hãy gỡ bớt rồi quay lại!` }
  } else {
    pokedexResult.value = { ok: false, message: '⚠️ Không thể đăng ký vào Pokédex!' }
  }
}

function nextSlide() {
  if (!isLastSlide.value) {
    slideIdx.value++
    return
  }
  step.value = 'final'
}

function startTraining() {
  emit('training')
}

function gotoCampaign() {
  setOnboardingStage(STORY_STAGES.GO_CAMPAIGN)
  emit('gotoCampaign')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-slide-up">
        <!-- Header -->
        <div class="relative border-b border-slate-200 bg-gradient-to-r from-sky-500 to-emerald-500 p-6 text-center">
          <h2 class="text-2xl font-bold text-white">🏥 Bệnh viện Pokémon</h2>
          <p class="mt-1 text-sky-50">Gặp gỡ Y tá — đăng ký Pokédex & học cách chiến đấu</p>
          <button
            @click="emit('close')"
            class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/40"
            title="Đóng"
          >
            ×
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <!-- BƯỚC 1: HỘI THOẠI CHÀO -->
          <div v-if="step === 'greet'" class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-sky-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-xl">👩‍⚕️</span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">{{ greetingLine }}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span v-for="(ln, i) in GREETING_LINES" :key="i" class="h-1.5 flex-1 rounded-full transition" :class="i <= lineIdx ? 'bg-sky-500' : 'bg-slate-200'"></span>
            </div>
            <button
              @click="nextGreeting"
              class="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              {{ isLastGreeting ? 'Đăng ký vào Pokédex ▸' : 'Tiếp tục ▸' }}
            </button>
          </div>

          <!-- BƯỚC 2: ĐĂNG KÝ POKÉDEX -->
          <div v-else-if="step === 'pokedex'" class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-sky-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-xl">👩‍⚕️</span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">
                Đây là Pokédex — thiết bị ghi nhận mọi Pokémon mà cháu đã có. Ta sẽ đăng ký người bạn đồng hành của cháu!
              </p>
            </div>

            <div v-if="starter" class="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <PokeSprite :name="starter.name" :type="starter.type" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" :rounded="'rounded-full'" />
              <div>
                <div class="text-base font-bold text-slate-800">{{ starter.name }}</div>
                <TypeBadge :type="starter.type" />
                <div class="mt-1 text-xs text-slate-500">Lv.{{ starter.level }}</div>
              </div>
            </div>

            <div
              v-if="pokedexResult"
              class="rounded-lg border p-3 text-center text-sm font-bold"
              :class="pokedexResult.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-red-300 bg-red-50 text-red-600'"
            >
              {{ pokedexResult.message }}
            </div>

            <button
              @click="step = 'slides'"
              class="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              Tuyệt vời! Dạy ta cách chiến đấu ▸
            </button>
          </div>

          <!-- BƯỚC 3: SLIDES HƯỚNG DẪN -->
          <div v-else-if="step === 'slides'" class="space-y-4">
            <div class="rounded-xl bg-gradient-to-br from-slate-50 to-sky-50 p-6 text-center">
              <div class="text-5xl">{{ currentSlide.icon }}</div>
              <h3 class="mt-3 text-lg font-bold text-slate-800">{{ currentSlide.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ currentSlide.text }}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span v-for="(s, i) in SLIDES" :key="i" class="h-1.5 flex-1 rounded-full transition" :class="i <= slideIdx ? 'bg-sky-500' : 'bg-slate-200'"></span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-slate-400">Slide {{ slideIdx + 1 }}/{{ SLIDES.length }}</span>
              <button
                @click="nextSlide"
                class="rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 text-base font-bold text-white transition hover:brightness-110"
              >
                {{ isLastSlide ? 'Ta hiểu rồi! ▸' : 'Tiếp theo ▸' }}
              </button>
            </div>
          </div>

          <!-- BƯỚC 4: LỰA CHỌN -->
          <div v-else class="space-y-4">
            <div class="rounded-xl bg-emerald-50 p-4 text-center">
              <div class="text-4xl">👩‍⚕️</div>
              <p class="mt-2 text-base leading-relaxed text-slate-700">
                Giờ cháu đã nắm được cơ chế chiến đấu cơ bản. Hãy làm một <b>trận huấn luyện</b> để thực hành
                với Fuecoco hoang dã cấp 1 — hoặc đi thẳng đến <b>Cửa Chiến dịch ⚔️</b> ở thị trấn!
              </p>
            </div>
            <button
              @click="startTraining"
              class="w-full rounded-lg bg-gradient-to-r from-amber-500 to-red-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              ⚔️ Trận Huấn Luyện
            </button>
            <button
              @click="gotoCampaign"
              class="w-full rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-bold text-slate-600 transition hover:bg-slate-50"
            >
              ➡️ Đi Đến Cửa Chiến Dịch (bỏ qua huấn luyện)
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
