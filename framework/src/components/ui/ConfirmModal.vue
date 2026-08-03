<script setup>
import { confirmState, resolveConfirm } from './toast.js'
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirmState.open" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="resolveConfirm(false)">
        <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <h3 class="text-center text-lg font-bold text-slate-800">{{ confirmState.title }}</h3>
          <p class="mt-3 whitespace-pre-line text-center text-sm text-slate-600">{{ confirmState.message }}</p>
          <div class="mt-6 flex gap-2">
            <button
              @click="resolveConfirm(false)"
              class="flex-1 rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
            >
              {{ confirmState.cancelText }}
            </button>
            <button
              @click="resolveConfirm(true)"
              class="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              :class="confirmState.danger ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-amber-500 to-fuchsia-600'"
            >
              {{ confirmState.okText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
</style>
