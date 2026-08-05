<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['complete'])

const lineIdx = ref(0)
const showGuidance = ref(false)

const LINES = [
  'Cái gì... đây là đâu? Mình vừa tỉnh dậy trên một chiếc giường lạ hoắc trong một căn nhà lạ hoắc...!',
  'Chẳng lẽ... mình thật sự xuyên vào thế giới Pokémon trong cuốn truyện rồi?',
  'Trên bàn có lá thư để lại: "Hãy đến nhà Giáo sư Oak nhận Pokémon khởi đầu."',
]

const currentLine = computed(() => LINES[lineIdx.value])
const isLastLine = computed(() => lineIdx.value >= LINES.length - 1)

function nextLine() {
  if (!isLastLine.value) {
    lineIdx.value++
    return
  }
  showGuidance.value = true
}

function close() {
  emit('complete')
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
        <div class="border-b border-slate-200 bg-gradient-to-r from-sky-500 to-indigo-500 p-6 text-center">
          <h2 class="text-3xl font-bold text-white">🏠 Căn nhà xa lạ</h2>
          <p class="mt-1 text-sky-50">Tỉnh dậy ở một thế giới mới</p>
        </div>

        <!-- Body -->
        <div class="p-6">
          <!-- TỰ THOẠI -->
          <div v-if="!showGuidance" class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-sky-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-xl">💭</span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">{{ currentLine }}</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span v-for="(ln, i) in LINES" :key="i" class="h-1.5 flex-1 rounded-full transition" :class="i <= lineIdx ? 'bg-sky-500' : 'bg-slate-200'"></span>
            </div>
            <button
              @click="nextLine"
              class="w-full rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              {{ isLastLine ? 'Xem việc cần làm ▸' : 'Tiếp tục ▸' }}
            </button>
          </div>

          <!-- CHỈ DẪN VIỆC CẦN LÀM -->
          <div v-else class="space-y-4">
            <div class="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div class="mb-2 text-center text-sm font-bold text-amber-700">🧭 Việc cần làm</div>
              <ol class="space-y-1.5 text-sm text-slate-700">
                <li>1. Ra khỏi nhà (bước đến cửa phía trên).</li>
                <li>2. Đi sang <b>tòa nhà bên phải</b> ở thị trấn — nhà của Giáo sư Oak.</li>
                <li>3. Nói chuyện với Oak để nhập tên và nhận Pokémon khởi đầu!</li>
              </ol>
            </div>

            <button
              @click="close"
              class="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-amber-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              🚪 Ra khỏi nhà ▸
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
