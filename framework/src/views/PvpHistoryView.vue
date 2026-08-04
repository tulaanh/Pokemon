<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { showToast } from '../components/ui/toast.js'

const filters = [
  { id: 'all', label: 'Tất cả', icon: '📜' },
  { id: 'you', label: 'Thắng', icon: '🏆' },
  { id: 'opponent', label: 'Thua', icon: '💀' },
  { id: 'draw', label: 'Hòa', icon: '🤝' },
]

const activeFilter = ref('all')

const matches = computed(() => {
  const list = Array.isArray(store.pvp.history) ? store.pvp.history : []
  if (activeFilter.value === 'all') return list
  return list.filter((match) => match.result === activeFilter.value)
})

const summary = computed(() => ({
  total: store.pvp.wins + store.pvp.losses + store.pvp.draws,
  wins: store.pvp.wins,
  losses: store.pvp.losses,
  draws: store.pvp.draws,
}))

function resultInfo(result) {
  if (result === 'you') return { text: 'THẮNG', icon: '🏆', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
  if (result === 'opponent') return { text: 'THUA', icon: '💀', cls: 'border-rose-200 bg-rose-50 text-rose-700' }
  return { text: 'HÒA', icon: '🤝', cls: 'border-amber-200 bg-amber-50 text-amber-700' }
}

function formatDate(ts) {
  if (!ts) return 'Không rõ thời gian'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(ts))
}

function replay(match) {
  showToast(`📼 Replay ${match.id} sẽ mở khi backend replay sẵn sàng`, 'info')
}
</script>

<template>
  <section class="space-y-5">
    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-bold text-indigo-600">📜 Nhật ký Arena</p>
          <h1 class="text-2xl font-black text-slate-900">Lịch Sử Đấu PvP</h1>
          <p class="text-sm text-slate-500">Hiển thị từ `store.pvp.history`, tối đa 50 trận gần nhất.</p>
        </div>
        <div class="grid grid-cols-4 gap-2 text-center text-xs sm:w-[360px]">
          <div class="rounded-xl bg-slate-50 p-2"><b class="block text-lg text-slate-800">{{ summary.total }}</b>Trận</div>
          <div class="rounded-xl bg-emerald-50 p-2"><b class="block text-lg text-emerald-600">{{ summary.wins }}</b>Thắng</div>
          <div class="rounded-xl bg-rose-50 p-2"><b class="block text-lg text-rose-600">{{ summary.losses }}</b>Thua</div>
          <div class="rounded-xl bg-amber-50 p-2"><b class="block text-lg text-amber-600">{{ summary.draws }}</b>Hòa</div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="filter in filters"
        :key="filter.id"
        @click="activeFilter = filter.id"
        class="rounded-xl px-4 py-2 text-sm font-bold transition"
        :class="activeFilter === filter.id ? 'bg-indigo-600 text-white shadow' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
      >
        {{ filter.icon }} {{ filter.label }}
      </button>
    </div>

    <div v-if="matches.length" class="space-y-3">
      <article
        v-for="match in matches"
        :key="match.id"
        class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md md:grid-cols-[120px_1fr_130px_120px] md:items-center"
      >
        <div class="inline-flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black" :class="resultInfo(match.result).cls">
          <span>{{ resultInfo(match.result).icon }}</span>
          {{ resultInfo(match.result).text }}
        </div>
        <div>
          <div class="font-black text-slate-900">VS {{ match.opponent?.name || 'Đối thủ ẩn danh' }}</div>
          <div class="text-sm text-slate-500">Replay ID: <span class="font-mono">{{ match.id }}</span></div>
          <div class="text-xs text-slate-400">{{ formatDate(match.date) }}</div>
        </div>
        <div class="text-left md:text-right">
          <div class="text-xs font-bold uppercase text-slate-400">ELO thay đổi</div>
          <div class="text-2xl font-black" :class="Number(match.eloChange) >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ Number(match.eloChange) >= 0 ? '+' : '' }}{{ match.eloChange || 0 }}
          </div>
        </div>
        <button @click="replay(match)" class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
          ▶️ Xem lại
        </button>
      </article>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
      <div class="text-5xl">📭</div>
      <h2 class="mt-3 text-lg font-black text-slate-700">Chưa có trận đấu phù hợp</h2>
      <p class="text-sm">Hãy gặp James ở Arena và chọn “Tìm Trận PvP” để bắt đầu ghi lịch sử.</p>
    </div>
  </section>
</template>