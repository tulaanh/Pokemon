<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { computeMergePreview, executeMerge } from '../game/merge.js'
import { showToast } from '../components/ui/toast.js'
import MergeSlot from '../components/merge/MergeSlot.vue'
import MergeSelectModal from '../components/merge/MergeSelectModal.vue'

const selectOpen = ref(false)
const successMessage = ref('')

const preview = computed(() => computeMergePreview())

const mainPoke = computed(() => (store.mergeSlotMain !== null ? store.team[store.mergeSlotMain] : null))
const subPoke = computed(() => (store.mergeSlotSub !== null ? store.team[store.mergeSlotSub] : null))

function openSelect(slot) {
  store.currentSelectingSlot = slot
  successMessage.value = ''
  selectOpen.value = true
}

function onMerge() {
  const result = executeMerge()
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  successMessage.value = result.poke ? `${result.poke.name} V${result.poke.vLevel}` : 'Thành công'
  if (result.unlockedTalent) {
    successMessage.value += ` — ⭐ Khai phá Tài năng: ${result.unlockedTalent.name}`
  }
  if (result.evolved && result.evolved.length > 0) {
    const last = result.evolved[result.evolved.length - 1]
    successMessage.value += ` — 🔥 TIẾN HÓA: ${last.from} → ${last.next}`
  }
  showToast('Hợp nhất thành công!', 'success')
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="app-card p-6">
      <h3 class="text-lg font-bold text-slate-800">🧬 Viện Hợp Nhất Pokémon (Nâng Cấp V)</h3>
      <p class="mt-1 text-center text-sm text-slate-500">
        Gộp 2 Pokémon <b class="text-slate-700">cùng loại & cùng cấp V</b> để tăng cấp V (Tăng % Chỉ số gốc). Phôi phụ sẽ bị tiêu biến!
      </p>

      <!-- SLOTS -->
      <div class="mt-5 flex items-center gap-3">
        <div class="flex-1">
          <MergeSlot :poke="mainPoke" placeholder="+ Chọn Phôi Chính" @select="openSelect('main')" />
        </div>
        <div class="text-2xl font-black text-slate-300">+</div>
        <div class="flex-1">
          <MergeSlot :poke="subPoke" placeholder="+ Chọn Phôi Phụ" @select="openSelect('sub')" />
        </div>
      </div>

      <!-- PREVIEW -->
      <div class="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
        <template v-if="!preview">
          <i class="text-slate-400">Vui lòng chọn đủ 2 Pokémon...</i>
        </template>

        <template v-else-if="!preview.ok">
          <span class="font-semibold text-red-500">{{ preview.message }}</span>
        </template>

        <template v-else>
          <div class="mb-3 text-center font-bold text-emerald-600">
            ✅ HỢP NHẤT THÀNH: {{ preview.temp.name }} V{{ preview.temp.vLevel }}
          </div>
          <div v-if="preview.willEvolve && preview.willEvolve.length > 0" class="mb-3 rounded-lg border border-amber-400 bg-amber-50 p-2 text-center text-sm font-bold text-amber-600">
            🔥 SẼ TIẾN HÓA: {{ preview.willEvolve[preview.willEvolve.length - 1].from }} → {{ preview.willEvolve[preview.willEvolve.length - 1].next }}
          </div>
          <small class="block text-slate-500">📊 Chỉ số sau khi nâng cấp:</small>
          <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>HP: <b class="text-slate-800">{{ preview.temp.maxHp }}</b> <span class="text-emerald-600">(+{{ preview.diffs.hp }})</span></div>
            <div>ATK: <b class="text-slate-800">{{ preview.temp.atk }}</b> <span class="text-emerald-600">(+{{ preview.diffs.atk }})</span></div>
            <div>DEF: <b class="text-slate-800">{{ preview.temp.def }}</b> <span class="text-emerald-600">(+{{ preview.diffs.def }})</span></div>
            <div>SPD: <b class="text-slate-800">{{ preview.temp.speed }}</b> <span class="text-emerald-600">(+{{ preview.diffs.spd }})</span></div>
          </div>
        </template>
      </div>

      <!-- SUCCESS BANNER -->
      <div v-if="successMessage" class="mt-3 rounded-xl border border-emerald-400/60 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-600">
        🧬 HỢP NHẤT THÀNH CÔNG! {{ successMessage }}
      </div>

      <button
        @click="onMerge"
        :disabled="!preview || !preview.ok"
        class="app-btn-primary mt-5 w-full py-3"
      >
        🧬 TIẾN HÀNH HỢP NHẤT
      </button>
    </div>

    <MergeSelectModal :open="selectOpen" @close="selectOpen = false" />
  </div>
</template>
