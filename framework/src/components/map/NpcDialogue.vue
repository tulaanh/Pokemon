<script setup>
import { ref, computed, watch } from 'vue'
import { NPCS, QUESTS, getNpcQuestStatus, acceptNpcQuest, claimQuestReward } from '../../game/quests.js'
import { store } from '../../game/store.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  npcId: { type: String, default: '' },
  mode: { type: String, default: 'smalltalk' },
})

const emit = defineEmits(['complete'])

const step = ref('intro')
const lineIdx = ref(0)
const status = ref('none')

const npc = computed(() => NPCS[props.npcId] || null)
const quest = computed(() => {
  if (!npc.value?.questId) return null
  return QUESTS[npc.value.questId] || null
})
const questState = computed(() => getNpcQuestStatus(props.npcId))

const smallTalkLines = computed(() => npc.value?.smallTalk || [])
const currentLine = computed(() => smallTalkLines.value[lineIdx.value] || '')
const isLastLine = computed(() => lineIdx.value >= smallTalkLines.value.length - 1)

function nextLine() {
  if (!isLastLine.value) {
    lineIdx.value++
    return
  }
  emit('complete')
}

function startQuest() {
  const result = acceptNpcQuest(props.npcId)
  if (!result.ok) return
  status.value = 'active'
  step.value = 'quest'
}

function claimReward() {
  if (!quest.value) return
  const result = claimQuestReward(quest.value.id)
  if (!result.ok) return
  status.value = 'claimed'
}

function close() {
  emit('complete')
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      step.value = props.mode === 'quest' ? 'quest' : 'intro'
      lineIdx.value = 0
      if (props.mode === 'quest') {
        const qs = questState.value
        if (qs?.status === 'done') status.value = 'done'
        else if (qs?.status === 'claimed') status.value = 'claimed'
        else if (qs?.status === 'active') status.value = 'active'
        else status.value = 'none'
      } else {
        status.value = 'none'
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      @click.self="close"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-slide-up">
        <!-- Header -->
        <div class="border-b border-slate-200 bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-center">
          <span class="text-4xl">{{ npc?.icon || '👤' }}</span>
          <h2 class="mt-1 text-xl font-bold text-white">{{ npc?.name || 'NPC' }}</h2>
        </div>

        <!-- Body -->
        <div class="p-5">
          <!-- SMALLTALK MODE -->
          <div v-if="step === 'intro' && mode === 'smalltalk'" class="space-y-4">
            <div class="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-xl">
                {{ npc?.icon || '👤' }}
              </span>
              <p class="pt-2 text-base leading-relaxed text-slate-700">{{ currentLine }}</p>
            </div>
            <div v-if="smallTalkLines.length > 1" class="flex items-center gap-1.5">
              <span v-for="(_, i) in smallTalkLines" :key="i" class="h-1.5 flex-1 rounded-full transition" :class="i <= lineIdx ? 'bg-amber-500' : 'bg-slate-200'"></span>
            </div>
            <button
              @click="nextLine"
              class="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
            >
              {{ isLastLine ? 'Đóng ▸' : 'Tiếp tục ▸' }}
            </button>
          </div>

          <!-- QUEST MODE -->
          <div v-else-if="step === 'quest' && mode === 'quest'" class="space-y-4">
            <!-- Chưa nhận nhiệm vụ -->
            <div v-if="status === 'none'">
              <div class="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-xl">
                  {{ npc?.icon || '👤' }}
                </span>
                <p class="pt-2 text-base leading-relaxed text-slate-700">
                  Cháu có muốn nhận nhiệm vụ từ ta không?
                </p>
              </div>
              <div v-if="quest" class="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <div class="text-sm font-bold text-amber-800">📜 {{ quest.name }}</div>
                <div class="mt-1 text-sm text-amber-700">{{ quest.desc }}</div>
                <div class="mt-2 text-sm font-semibold text-amber-600">Phần thưởng: {{ quest.rewardText }}</div>
              </div>
              <div class="mt-4 flex gap-3">
                <button
                  @click="startQuest"
                  class="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 text-lg font-bold text-white transition hover:brightness-110"
                >
                  Nhận nhiệm vụ
                </button>
                <button
                  @click="close"
                  class="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Để sau
                </button>
              </div>
            </div>

            <!-- Đang làm nhiệm vụ -->
            <div v-else-if="status === 'active'">
              <div class="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-xl">
                  {{ npc?.icon || '👤' }}
                </span>
                <p class="pt-2 text-base leading-relaxed text-slate-700">
                  {{ questState?.progress || 0 }}/{{ questState?.target }} — {{ questState?.desc || '' }}
                </p>
              </div>
              <div class="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  :style="{ width: Math.min(100, ((questState?.progress || 0) / (questState?.target || 1)) * 100) + '%' }"
                ></div>
              </div>
              <button
                @click="close"
                class="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            <!-- Hoàn thành, chưa nhận thưởng -->
            <div v-else-if="status === 'done'">
              <div class="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-xl">🎉</span>
                <p class="pt-2 text-base leading-relaxed text-slate-700">
                  Cháu đã hoàn thành nhiệm vụ! Hãy nhận phần thưởng nhé.
                </p>
              </div>
              <div class="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                <div class="text-sm font-bold text-emerald-800">Phần thưởng: {{ quest?.rewardText }}</div>
              </div>
              <button
                @click="claimReward"
                class="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-3 text-lg font-bold text-white transition hover:brightness-110"
              >
                Nhận thưởng ▸
              </button>
            </div>

            <!-- Đã nhận thưởng -->
            <div v-else-if="status === 'claimed'">
              <div class="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-xl">👩</span>
                <p class="pt-2 text-base leading-relaxed text-slate-700">
                  Cảm ơn cháu đã giúp đỡ! Ta rất vui vì cháu đã hoàn thành nhiệm vụ. Hãy quay lại nếu cháu cần thêm giúp đỡ nhé!
                </p>
              </div>
              <button
                @click="close"
                class="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
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

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>