<script setup>
import { toasts, dismissToast } from './toast.js'
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed right-4 top-20 z-[60] flex w-72 flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-lg"
          :class="t.style"
          @click="dismissToast(t.id)"
        >
          <span class="shrink-0">{{ t.icon }}</span>
          <span class="min-w-0 flex-1 leading-snug">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
