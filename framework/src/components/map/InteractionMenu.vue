<script setup>
import { computed } from 'vue'
import { NPCS } from '../../game/quests.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  choices: { type: Array, default: () => [] },
})

const emit = defineEmits(['select', 'close'])

function onSelect(choiceId) {
  emit('select', choiceId)
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="w-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
          <span class="text-2xl">{{ icon }}</span>
          {{ title }}
        </h3>
        <div class="space-y-2">
          <button
            v-for="c in choices"
            :key="c.id"
            @click="onSelect(c.id)"
            class="flex w-full items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-left transition hover:border-amber-400 hover:bg-amber-50"
          >
            <span class="text-2xl">{{ c.icon }}</span>
            <span class="text-sm font-bold text-slate-700">{{ c.label }}</span>
          </button>
        </div>
        <button
          @click="emit('close')"
          class="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          Đóng
        </button>
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

.animate-scale-in {
  animation: scale-in 0.15s ease-out;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>