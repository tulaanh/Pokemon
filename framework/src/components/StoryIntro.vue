<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['done'])

const lineIdx = ref(0)
const imageShown = ref(false)

const LINES = [
  'Cuối cùng cũng tối rồi — giờ là lúc mình đọc tiếp cuốn truyện Pokémon yêu thích!',
  'Đang đọc dở, bỗng... cuốn truyện trượt khỏi tay và rơi xuống sàn nhà.',
  'Mình cúi xuống nhặt lên... cuốn truyện bỗng phát sáng rực rỡ!',
  'Một luồng sáng xoáy cuốn mình vào trong những trang giấy...',
  'Thế giới quay cuồng... mình lạc giữa một vùng ánh sáng mênh mông.',
  'Khi tỉnh dậy, mình đang nằm trên một chiếc giường xa lạ — một thế giới Pokémon có thật!',
]

const currentLine = computed(() => LINES[lineIdx.value])
const isLastLine = computed(() => lineIdx.value >= LINES.length - 1)

watch(
  () => props.open,
  (v) => {
    if (v) {
      lineIdx.value = 0
      imageShown.value = false
      setTimeout(() => {
        imageShown.value = true
      }, 100)
    }
  },
  { immediate: true },
)

function nextLine() {
  if (!isLastLine.value) {
    lineIdx.value++
    return
  }
  emit('done')
}

function skipAll() {
  emit('done')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex flex-col items-center justify-end overflow-hidden bg-black"
    >
      <!-- ẢNH CỐT TRUYỆN MỞ ĐẦU (hiện lên từ từ, mỗi dòng đổi ảnh) -->
      <div
        class="absolute inset-0 transition-opacity duration-[2500ms] ease-in-out"
        :class="imageShown ? 'opacity-100' : 'opacity-0'"
      >
        <Transition name="img-fade" mode="out-in">
          <div
            :key="lineIdx"
            class="absolute inset-0 bg-cover bg-center"
            :style="{ backgroundImage: `url('/images/hinh_nen/begin_story_${lineIdx + 1}.png')` }"
          ></div>
        </Transition>
      </div>
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10"></div>

      <!-- HỘI THOẠI -->
      <div class="relative z-10 mb-[8vh] w-full max-w-2xl px-6">
        <div class="rounded-2xl border border-white/15 bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
          <div class="mb-3 flex items-center gap-1.5">
            <span v-for="(ln, i) in LINES" :key="i" class="h-1.5 flex-1 rounded-full transition" :class="i <= lineIdx ? 'bg-amber-400' : 'bg-white/15'"></span>
          </div>

          <div class="min-h-[4.5rem]">
            <div class="flex items-center gap-2">
              <span class="flex h-8 w-8 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-base">📖</span>
              <span class="text-xs font-black tracking-wide text-amber-300">CỐT TRUYỆN MỞ ĐẦU</span>
            </div>
            <p class="mt-2 text-base leading-relaxed text-white">{{ currentLine }}</p>
          </div>

          <div class="mt-4 flex items-center justify-between gap-3">
            <button
              @click="skipAll"
              class="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
            >
              ⏭ Bỏ qua
            </button>
            <button
              @click="nextLine"
              class="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-black text-white transition hover:brightness-110"
            >
              {{ isLastLine ? '✅ Vào Thế Giới Pokémon' : 'Tiếp tục ▸' }}
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
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.img-fade-enter-active,
.img-fade-leave-active {
  transition: opacity 0.6s ease;
}
.img-fade-enter-from,
.img-fade-leave-to {
  opacity: 0;
}
</style>
