<script setup>
import { ref } from 'vue'
import { battle } from '../game/battle.js'
import { store } from '../game/store.js'
import { startTrainingBattle } from '../game/training.js'
import { setOnboardingStage, STORY_STAGES } from '../game/story.js'
import { showToast } from '../components/ui/toast.js'
import BattleArena from '../components/battle/BattleArena.vue'
import RarityText from '../components/RarityText.vue'

const emit = defineEmits(['back'])

const scene = ref('battle')

if (!startTrainingBattle()) {
  scene.value = 'done'
  battle.resultWin = false
  showToast('⚠️ Không thể bắt đầu trận huấn luyện — chưa có Pokémon trong đội!', 'warning')
}

function onCloseResult() {
  battle.isBattling = false
  const won = battle.resultWin
  battle.teamIndices = [null, null, null]
  if (won) setOnboardingStage(STORY_STAGES.GO_CAMPAIGN)
  scene.value = 'done'
}

function retry() {
  if (startTrainingBattle()) {
    scene.value = 'battle'
  } else {
    showToast('⚠️ Không thể bắt đầu trận huấn luyện — chưa có Pokémon trong đội!', 'warning')
  }
}

const starterPoke = () =>
  store.team.find((p) => p && String(p.id).startsWith('starter-')) ||
  store.team.find((p) => p && ['Bulbasaur', 'Charmander', 'Squirtle'].includes(p.name)) ||
  store.team[0] ||
  null
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- SCENE 1: SÀN ĐẤU -->
    <div v-if="scene === 'battle'">
      <BattleArena @close-result="onCloseResult" />
    </div>

    <!-- SCENE 2: KẾT THÚC / HƯỚNG DẪN -->
    <div v-else class="app-card p-6">
      <div class="text-center">
        <div class="text-5xl">{{ battle.resultWin ? '🎓' : '💀' }}</div>
        <h3
          class="mt-3 text-xl font-black"
          :class="battle.resultWin ? 'text-emerald-600' : 'text-red-500'"
        >
          {{ battle.resultWin ? 'Hoàn Thành Trận Huấn Luyện!' : 'Trận Huấn Luyện Thất Bại!' }}
        </h3>

        <div v-if="battle.resultWin" class="mx-auto mt-4 max-w-md space-y-2 text-sm text-slate-600">
          <p>Bạn đã làm quen với cơ chế chiến đấu cơ bản: lượt đánh, kỹ năng, khiên và hiệu ứng!</p>
          <div class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-left">
            <div class="mb-2 text-center text-sm font-bold text-amber-700">🧭 Việc cần làm tiếp theo</div>
            <ol class="space-y-1.5 text-sm text-slate-700">
              <li>1. Bấm <b>🏠 Trở Về</b> để quay lại bản đồ.</li>
              <li>2. Đi đến <b>Cửa Chiến dịch ⚔️</b> ở thị trấn (theo dấu 📍).</li>
              <li>3. Chọn Pokémon trong Pokédex và bắt đầu hành trình!</li>
            </ol>
          </div>
        </div>

        <div v-else class="mx-auto mt-4 max-w-md space-y-2 text-sm text-slate-600">
          <p>Đừng nản chí! Hãy chú ý đến <b>sát thương, khiên</b> và <b>hiệu ứng</b> của kỹ năng.</p>
          <p>Kiểm tra kỹ năng nào tốn ít MP hơn, và dùng chiêu mạnh đúng lúc.</p>
        </div>

        <div v-if="starterPoke()" class="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
          <span>Pokémon của bạn:</span>
          <RarityText :rarity="starterPoke().rarity" :label="starterPoke().name" />
          <span class="text-xs text-slate-400">(Lv.{{ starterPoke().level }})</span>
        </div>

        <button
          v-if="!battle.resultWin"
          @click="retry"
          class="app-btn-primary mt-6 w-full max-w-sm py-3"
        >
          🔄 Thử Lại Trận Huấn Luyện
        </button>
        <button
          v-else
          @click="emit('back')"
          class="app-btn-primary mt-6 w-full max-w-sm py-3"
        >
          🏠 Trở Về Bản Đồ ▸
        </button>
      </div>
    </div>
  </div>
</template>
