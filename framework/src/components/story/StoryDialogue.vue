<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  lines: { type: Array, required: true },
})

const emit = defineEmits(['done'])

const lineIdx = ref(0)

const current = computed(() => props.lines[lineIdx.value] || null)
const isLast = computed(() => lineIdx.value >= props.lines.length - 1)

function next() {
  if (!isLast.value) {
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
  <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
    <!-- THANH TIẾN ĐỘ DÒNG -->
    <div class="mb-4 flex items-center gap-1.5">
      <span v-for="(ln, i) in lines" :key="i" class="h-1.5 flex-1 rounded-full transition" :class="i <= lineIdx ? 'bg-amber-500' : 'bg-slate-200'"></span>
    </div>

    <div v-if="current" class="min-h-[8rem]">
      <div class="flex items-center gap-2">
        <span class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg">
          {{ current.speaker === 'Người Kể' ? '📜' : '👤' }}
        </span>
        <span class="text-sm font-black text-amber-600">{{ current.speaker }}</span>
      </div>
      <p class="mt-3 text-base leading-relaxed text-slate-700">{{ current.text }}</p>
    </div>

    <div class="mt-5 flex items-center justify-between gap-3">
      <button
        @click="skipAll"
        class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
      >
        ⏭ Bỏ qua
      </button>
      <button
        @click="next"
        class="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-black text-white transition hover:brightness-110"
      >
        {{ isLast ? '✅ Kết thúc' : 'Tiếp tục ▸' }}
      </button>
    </div>
  </div>
</template>
