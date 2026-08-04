<script setup>
import { screenTransition } from '../../game/screenTransition.js'

const progressText = () =>
  screenTransition.progress != null ? `${screenTransition.progress}%` : ''
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="screenTransition.active"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-5 px-6 text-center">
          <!-- Vòng quay -->
          <div class="relative h-20 w-20">
            <div class="absolute inset-0 rounded-full border-4 border-white/20"></div>
            <div
              class="absolute inset-0 animate-spin rounded-full border-4 border-transparent"
              style="border-top-color: #fbbf24; border-right-color: #ec4899"
            ></div>
            <div class="absolute inset-0 flex items-center justify-center text-3xl">⚡</div>
          </div>

          <div class="text-lg font-bold text-white">{{ screenTransition.label }}</div>

          <!-- Thanh tiến trình (chỉ khi có progress) -->
          <div v-if="screenTransition.progress != null" class="w-64">
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
              <div
                class="h-full rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 transition-all duration-200 ease-out"
                :style="{ width: screenTransition.progress + '%' }"
              ></div>
            </div>
            <div class="mt-1.5 text-xs font-semibold text-white/80">{{ progressText() }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
