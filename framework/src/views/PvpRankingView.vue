<script setup>
import { computed, ref } from 'vue'
import { store } from '../game/store.js'
import { getPvpRank } from '../game/pvp/rank.js'
import PvpPlayerIdentity from '../components/pvp/PvpPlayerIdentity.vue'

const tabs = [
  { id: 'global', label: 'Toàn cầu', icon: '🌍' },
  { id: 'week', label: 'Tuần', icon: '📅' },
  { id: 'season', label: 'Mùa', icon: '🏆' },
]

const activeTab = ref('global')

const mockNames = [
  'Red', 'Blue', 'Cynthia', 'Lance', 'Steven', 'Diantha', 'Leon', 'Nemona', 'James', 'Misty',
  'Brock', 'Erika', 'Sabrina', 'Koga', 'Blaine', 'Giovanni', 'Wallace', 'Iris', 'N', 'May',
]

function makePlayer(i, scope) {
  const scopeBonus = scope === 'week' ? -60 : scope === 'season' ? 20 : 0
  const elo = Math.max(900, 1820 - i * 18 + scopeBonus + ((i * 37) % 31))
  const wins = Math.max(1, 92 - i + ((i * 5) % 13))
  const losses = Math.max(0, 18 + Math.floor(i / 3) + ((i * 7) % 9))
  const draws = i % 6 === 0 ? 1 : 0
  const total = wins + losses + draws
  return {
    rank: i + 1,
    name: mockNames[i % mockNames.length] + (i >= mockNames.length ? ` #${Math.floor(i / mockNames.length) + 1}` : ''),
    level: Math.max(1, 50 - Math.floor(i / 3)),
    elo,
    wins,
    losses,
    draws,
    winRate: Math.round((wins / total) * 100),
    streak: Math.max(0, 12 - Math.floor(i / 4)),
  }
}

const ranking = computed(() => Array.from({ length: 100 }, (_, i) => makePlayer(i, activeTab.value)))
const totalMatches = computed(() => store.pvp.wins + store.pvp.losses + store.pvp.draws)
const myWinRate = computed(() => totalMatches.value ? Math.round((store.pvp.wins / totalMatches.value) * 100) : 0)
const myRank = computed(() => {
  const higher = ranking.value.filter((p) => p.elo > store.pvp.elo).length
  return Math.min(101, higher + 1)
})
const seasonReward = computed(() => {
  if (store.pvp.elo >= 1600) return 'Rương Huyền Thoại + 500 PokePoint'
  if (store.pvp.elo >= 1300) return 'Rương Cao Cấp + 250 PokePoint'
  if (store.pvp.elo >= 1100) return 'Rương Arena + 100 PokePoint'
  return 'Rương Tân Binh'
})
const myRankBadge = computed(() => getPvpRank(store.pvp.elo))
</script>

<template>
  <section class="space-y-5">
    <div class="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-bold text-amber-700">🏆 Đấu Trường Trực Tuyến</p>
          <h1 class="text-2xl font-black text-slate-900">Bảng Xếp Hạng ELO</h1>
          <p class="text-sm text-slate-600">Dữ liệu UI mock trong lúc chờ server PvP đồng bộ BXH thật.</p>
        </div>
        <div class="rounded-xl bg-white/80 px-4 py-3 text-right shadow-sm">
          <div class="text-xs font-bold uppercase text-slate-500">ELO của bạn</div>
          <div class="flex items-center justify-end gap-2"><img :src="myRankBadge.image" :alt="myRankBadge.name" class="h-9 w-9" /><div class="text-right"><div class="text-2xl font-black text-indigo-600">{{ store.pvp.elo }}</div><div class="text-xs font-bold text-slate-500">{{ myRankBadge.name }}</div></div></div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex gap-2 border-b border-slate-100 bg-slate-50 p-3">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="rounded-xl px-4 py-2 text-sm font-bold transition"
            :class="activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'"
          >
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <div class="max-h-[620px] overflow-auto">
          <table class="w-full min-w-[760px] text-sm">
            <thead class="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm">
              <tr>
                <th class="px-4 py-3 text-left">Rank</th>
                <th class="px-4 py-3 text-left">Huấn luyện viên</th>
                <th class="px-4 py-3 text-right">ELO</th>
                <th class="px-4 py-3 text-right">Thắng/Thua</th>
                <th class="px-4 py-3 text-right">Tỷ lệ</th>
                <th class="px-4 py-3 text-right">Chuỗi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="player in ranking" :key="`${activeTab}-${player.rank}`" class="hover:bg-indigo-50/50">
                <td class="px-4 py-3 font-black" :class="player.rank <= 3 ? 'text-amber-600' : 'text-slate-600'">#{{ player.rank }}</td>
                <td class="px-4 py-3"><PvpPlayerIdentity :player="player" compact /></td>
                <td class="px-4 py-3 text-right font-black text-indigo-600">{{ player.elo }}</td>
                <td class="px-4 py-3 text-right text-slate-600">{{ player.wins }}/{{ player.losses }}/{{ player.draws }}</td>
                <td class="px-4 py-3 text-right font-bold" :class="player.winRate >= 55 ? 'text-emerald-600' : 'text-slate-600'">{{ player.winRate }}%</td>
                <td class="px-4 py-3 text-right font-bold text-orange-600">🔥 {{ player.streak }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <aside class="space-y-4">
        <div class="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-lg font-black text-slate-900">Thông tin của bạn</h2>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="rounded-xl bg-indigo-50 p-3">
              <div class="text-2xl font-black text-indigo-600">#{{ myRank }}</div>
              <div class="text-xs font-bold text-slate-500">Rank hiện tại</div>
            </div>
            <div class="rounded-xl bg-amber-50 p-3">
              <div class="flex items-center justify-center gap-2"><img :src="myRankBadge.image" :alt="myRankBadge.name" class="h-8 w-8" /><div class="text-left"><div class="text-2xl font-black text-amber-600">{{ store.pvp.elo }}</div><div class="text-xs font-bold text-slate-500">{{ myRankBadge.name }}</div></div></div>
              <div class="text-xs font-bold text-slate-500">ELO / Rank hiện tại</div>
            </div>
            <div class="rounded-xl bg-emerald-50 p-3">
              <div class="text-2xl font-black text-emerald-600">{{ myWinRate }}%</div>
              <div class="text-xs font-bold text-slate-500">Tỷ lệ thắng</div>
            </div>
            <div class="rounded-xl bg-orange-50 p-3">
              <div class="text-2xl font-black text-orange-600">{{ store.pvp.streak }}</div>
              <div class="text-xs font-bold text-slate-500">Chuỗi thắng</div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <h3 class="font-black text-emerald-800">🎁 Phần thưởng mùa</h3>
          <p class="mt-2 text-sm text-emerald-700">{{ seasonReward }}</p>
          <p class="mt-3 text-xs text-emerald-600">Reset mùa vào đầu mỗi tháng. ELO cơ bản: 1000, K-factor: 32.</p>
        </div>
      </aside>
    </div>
  </section>
</template>