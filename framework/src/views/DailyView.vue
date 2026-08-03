<script setup>
import { computed } from 'vue'
import { store } from '../game/store.js'
import { getCheckInStatus, checkIn, getQuestStatus, claimQuest } from '../game/daily.js'
import { showToast } from '../components/ui/toast.js'

const checkInStatus = computed(() => getCheckInStatus())
const quests = computed(() => getQuestStatus())

function onCheckIn() {
  const result = checkIn()
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  showToast(result.message, 'success')
}

function onClaim(questId) {
  const result = claimQuest(questId)
  if (!result.ok) {
    showToast(result.message, 'error')
    return
  }
  showToast(result.message, 'success')
}

function rewardText(reward) {
  if (!reward) return ''
  if (reward.type === 'gold') return `${reward.val.toLocaleString()} 💰`
  if (reward.type === 'gems') return `${reward.val.toLocaleString()} 💎`
  if (reward.type === 'pokePoint') return `${reward.val.toLocaleString()} 🎟️`
  if (reward.type === 'candy') return `${reward.val} 🍬`
  if (reward.type === 'stone') return '💎 Đá'
  return ''
}

function dayClaimed(i) {
  const claimed = checkInStatus.value.claimedDays
  if (claimed === 0) return false
  if (claimed === 7) return true
  return i < claimed
}

function isTodayTarget(i) {
  return i === checkInStatus.value.nextDayIndex && !checkInStatus.value.claimedToday
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <div class="app-card p-6">
      <h3 class="text-center text-lg font-bold text-slate-800">📅 Sự Kiện Hằng Ngày</h3>

      <!-- ĐIỂM DANH -->
      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div class="flex items-center justify-between">
          <h4 class="text-base font-bold text-purple-600">🎯 Điểm Danh 7 Ngày</h4>
          <span class="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
            Streak: {{ checkInStatus.streak }} 🔥
          </span>
        </div>
        <p class="mt-1 text-xs text-slate-500">
          Điểm danh liên tục để giữ streak. Bỏ lỡ 1 ngày sẽ reset về ngày đầu tiên.
        </p>

        <div class="mt-3 grid grid-cols-7 gap-1.5">
          <div
            v-for="(r, i) in checkInStatus.rewards"
            :key="i"
            class="flex flex-col items-center rounded-xl border p-2 text-center"
            :class="
              dayClaimed(i)
                ? 'border-emerald-400 bg-emerald-50'
                : isTodayTarget(i)
                  ? 'border-amber-400 bg-amber-50 shadow-md shadow-amber-200/50'
                  : 'border-slate-200 bg-white'
            "
          >
            <span class="text-[10px] font-black text-slate-500">Ngày {{ i + 1 }}</span>
            <span class="mt-0.5 text-sm font-bold text-slate-700">{{ rewardText(r) }}</span>
            <span v-if="dayClaimed(i)" class="mt-0.5 text-[10px] font-black text-emerald-600">✓ Xong</span>
            <span v-else-if="isTodayTarget(i)" class="mt-0.5 text-[10px] font-black text-amber-600">Hôm nay</span>
          </div>
        </div>

        <button
          @click="onCheckIn"
          :disabled="checkInStatus.claimedToday"
          class="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 px-5 py-2.5 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {{ checkInStatus.claimedToday ? '✅ Đã Điểm Danh Hôm Nay' : '🎯 Điểm Danh Ngay' }}
        </button>
      </div>

      <!-- NHIỆM VỤ HẰNG NGÀY -->
      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h4 class="text-base font-bold text-emerald-600">📋 Nhiệm Vụ Hằng Ngày</h4>
        <p class="mt-1 text-xs text-slate-500">Hoàn thành nhiệm vụ để nhận thưởng. Tiến độ reset mỗi ngày.</p>

        <div class="mt-3 space-y-2">
          <div v-for="q in quests" :key="q.id" class="rounded-xl border border-slate-200 bg-white p-3">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="text-sm font-bold text-slate-800">{{ q.icon }} {{ q.label }}</div>
                <div class="text-[11px] text-slate-500">{{ q.desc }}</div>
              </div>
              <span class="shrink-0 text-xs font-bold text-amber-600">+{{ q.rewardText }}</span>
            </div>

            <div class="mt-2 flex items-center gap-2">
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                  :style="{ width: Math.min(100, (q.progress / q.target) * 100) + '%' }"
                ></div>
              </div>
              <span class="whitespace-nowrap text-xs font-semibold text-slate-600">{{ q.progress }}/{{ q.target }}</span>
              <button
                v-if="q.claimed"
                disabled
                class="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-500"
              >
                ✓ Đã Nhận
              </button>
              <button
                v-else
                :disabled="q.progress < q.target"
                @click="onClaim(q.id)"
                class="shrink-0 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Nhận
              </button>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-4 text-center text-[11px] text-slate-400">
        Tài nguyên hiện có: 💰 {{ store.gold.toLocaleString() }} | 💎 {{ store.gems.toLocaleString() }} | 🍬 {{ store.inventory.candy }}
      </p>
    </div>
  </div>
</template>
