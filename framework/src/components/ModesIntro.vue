<script setup>
import { categories } from '../game/modes.js'

defineProps({
  open: { type: Boolean, default: false },
})
defineEmits(['done'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      @click.self="$emit('done')"
    >
      <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div class="text-center">
          <div class="text-4xl">🎮</div>
          <h3 class="mt-2 text-xl font-black text-slate-800">Các Chế Độ Trong Game</h3>
          <p class="mt-1 text-sm text-slate-500">Hành trình của bạn mới bắt đầu — đây là những chế độ đang có!</p>
        </div>

        <div class="mt-5 space-y-5">
          <div v-for="cat in categories" :key="cat.id">
            <div class="mb-2 flex items-baseline gap-2">
              <span class="text-lg">{{ cat.icon }}</span>
              <span class="text-sm font-black text-slate-700">{{ cat.label }}</span>
              <span class="text-[11px] text-slate-400">{{ cat.desc }}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div
                v-for="mode in cat.modes"
                :key="mode.id"
                class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span class="text-lg">{{ mode.icon }}</span>
                <span class="text-xs font-bold text-slate-700">{{ mode.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <button @click="$emit('done')" class="app-btn-primary mt-6 w-full py-2.5">
          Đã Hiểu ▸
        </button>
      </div>
    </div>
  </Teleport>
</template>
