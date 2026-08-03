<script setup>
import { ref, computed } from 'vue'
import { store } from '../../game/store.js'
import { healAllPokemon } from '../../game/store.js'
import { showToast } from '../ui/toast.js'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close', 'openRoster'])

const isOpen = computed({
  get() { return props.open },
  set(val) { emit('close') }
})

function onHeal() {
  if (!store.team.length) {
    showToast('⚠️ Bạn chưa có Pokémon nào trong đội!', 'warning')
    return
  }
  
  // Kiểm tra có Pokémon nào bị thương không
  const hasInjured = store.team.some(p => p.hp < p.maxHp)
  if (!hasInjured) {
    showToast('✨ Toàn đội đã khỏe mạnh, không cần hồi phục!', 'info')
    return
  }
  
  healAllPokemon()
  showToast('💚 Y tá đã hồi phục hoàn toàn toàn bộ đội Pokémon của bạn!', 'success')
  // Không đóng modal, cho phép người chơi chọn thêm xem đội hình
}

function onOpenRoster() {
  emit('openRoster')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click.self="isOpen = false"
    >
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div class="relative w-96 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
          <span class="text-3xl">🏥</span>
          Bệnh viện Pokémon
        </h3>
        
        <p class="mb-6 text-sm text-slate-600">
          Chào bạn! Tôi là y tá của Bệnh viện Pokémon. Bạn muốn tôi làm gì cho đội Pokémon của bạn?
        </p>
        
        <div class="space-y-3">
          <!-- Nút Hồi phục -->
          <button
            @click="onHeal"
            class="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-left transition hover:border-emerald-500 hover:bg-emerald-100"
          >
            <span class="text-3xl">💚</span>
            <div class="text-left">
              <div class="text-base font-bold text-emerald-800">Hồi phục toàn đội</div>
              <div class="text-xs text-emerald-600">Hồi 100% HP, MP, xóa hiệu ứng tiêu cực</div>
            </div>
          </button>
          
          <!-- Nút Xem đội hình -->
          <button
            @click="onOpenRoster"
            class="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-sky-400 bg-sky-50 p-4 text-left transition hover:border-sky-500 hover:bg-sky-100"
          >
            <span class="text-3xl">🎒</span>
            <div class="text-left">
              <div class="text-base font-bold text-sky-800">Xem đội hình</div>
              <div class="text-xs text-sky-600">Mở tab Đội Hình để quản lý Pokémon</div>
            </div>
          </button>
        </div>
        
        <button
          @click="isOpen = false"
          class="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          Đóng
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-in {
  animation: scale-in 0.15s ease-out;
}
</style>