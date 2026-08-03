<script setup>
import { computed } from 'vue'
import { getTypeEmoji, getTriggerName, skillValueText } from '../../game/inventory.js'
import { getEffectLabel } from '../../game/data.js'
import { getEvolutionInfo } from '../../game/evolution.js'
import RarityText from '../RarityText.vue'
import TypeBadge from './TypeBadge.vue'
import PokeStatBar from './PokeStatBar.vue'
import PokeSprite from '../PokeSprite.vue'

const props = defineProps({
  poke: { type: Object, required: true },
  layout: { type: String, default: 'modal' }, // 'modal' | 'card'
})

const isCard = computed(() => props.layout === 'card')
const vBadge = computed(() => (props.poke.vLevel > 0 ? `V${props.poke.vLevel}` : ''))
const passive = computed(() => props.poke.passives?.[0] || props.poke.passive || null)
const talents = computed(() => props.poke.talents || [])
const skills = computed(() => props.poke.skills || [])
const evolutionInfo = computed(() => getEvolutionInfo(props.poke))
const isMaxEvolved = computed(() => !evolutionInfo.value && (props.poke.evolutionCount || 0) > 0)

const talentMilestones = [1, 3, 5]

function cdText(sk) {
  return sk.cd > 0 ? `CD: ${sk.cd}t` : ''
}
</script>

<template>
  <div>
    <!-- HEADER -->
    <div class="flex items-center gap-3">
      <PokeSprite :name="poke.name" :type="poke.type" :size-class="'h-14 w-14'" :img-class="'h-14 w-14'" :rounded="'rounded-2xl'" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <RarityText :rarity="poke.rarity" :label="poke.name" class="text-base" />
          <span v-if="vBadge" class="rounded bg-gradient-to-r from-yellow-400 to-orange-500 px-1.5 text-[10px] font-black text-white">V{{ poke.vLevel }}</span>
        </div>
        <div class="mt-1 flex items-center gap-2">
          <TypeBadge :type="poke.type" />
          <span class="text-xs text-slate-500">Lv.{{ poke.level }} — {{ poke.rarity.name }}</span>
        </div>
        <small class="text-slate-500">HP: {{ poke.hp }}/{{ poke.maxHp }} | MP: {{ poke.mp || 0 }}/{{ poke.maxMp || 100 }}</small>
      </div>
      <slot name="actions"></slot>
    </div>

    <!-- CHỈ SỐ CƠ BẢN -->
    <div class="mt-4">
      <div class="mb-2 text-xs font-bold text-amber-600">📊 Chỉ Số Cơ Bản</div>
      <div class="space-y-1.5">
        <PokeStatBar label="HP" :value="poke.maxHp" />
        <PokeStatBar label="ATK" :value="poke.atk" />
        <PokeStatBar label="DEF" :value="poke.def" />
        <PokeStatBar label="SPD" :value="poke.speed" />
      </div>
    </div>

    <!-- TIẾN HÓA -->
    <div class="mt-4">
      <div class="mb-2 text-xs font-bold text-purple-600">🌟 Tiến Hóa</div>
      <div v-if="evolutionInfo" class="rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm">
        <div class="flex flex-wrap items-center gap-1.5">
          <b class="text-purple-700">{{ evolutionInfo.next }}</b>
          <template v-if="evolutionInfo.stone">
            <span class="text-slate-500">tiến hóa bằng</span>
            <b class="text-amber-600">{{ evolutionInfo.stone.emoji }} {{ evolutionInfo.stone.name }}</b>
          </template>
          <template v-else>
            <span class="text-slate-500">tiến hóa tại</span>
            <b class="text-amber-600">Lv.{{ evolutionInfo.atLevel }}</b>
          </template>
        </div>
        <small v-if="isCard" class="mt-1 block text-purple-500">Tiến hóa tăng vọt chỉ số (+60% HP/ATK/DEF, +30% SPD) và giữ nguyên V-Level.</small>
      </div>
      <div v-else-if="isMaxEvolved" class="rounded-lg border border-purple-200 bg-purple-50/50 p-3 text-sm">
        <b class="text-purple-700">{{ poke.name }}</b>
        <span class="text-slate-500"> đã tiến hóa tối đa. (Tiến hóa ×{{ poke.evolutionCount }})</span>
      </div>
      <div v-else class="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-400">
        Loài này không có dạng tiến hóa.
      </div>
    </div>

    <!-- NỘI TẠI + THIÊN PHÚ + KỸ NĂNG -->
    <div :class="isCard ? 'mt-4 grid gap-6 sm:grid-cols-2' : 'mt-4 space-y-5'">
      <div>
        <div class="mb-2 text-xs font-bold text-amber-600">🔥 Nội Tại (Passive)</div>
        <div v-if="passive" class="rounded-lg border border-dashed border-amber-400 bg-amber-50/60 p-3">
          <div class="flex justify-between gap-2">
            <b class="text-amber-700">{{ passive.name }}</b>
            <small class="text-slate-500">Kích hoạt: <b class="text-slate-600">{{ getTriggerName(passive.trigger) }}</b></small>
          </div>
          <div class="mt-1 text-sm italic text-amber-600">{{ passive.desc }}</div>
        </div>
        <div v-else class="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-400">Không có Nội Tại.</div>

        <div class="mb-2 mt-4 text-xs font-bold text-emerald-600">🌟 Thiên Phú (Talent) — {{ talents.length }}/3</div>
        <div v-if="talents.length > 0" class="space-y-2">
          <div v-for="(tl, i) in talents" :key="i" class="rounded-lg border border-dashed border-emerald-400 bg-emerald-50/60 p-3">
            <div class="flex justify-between gap-2">
              <b class="text-emerald-700">[Mốc V{{ talentMilestones[i] || '?' }}] {{ tl.name }}</b>
              <small class="text-slate-500">Kích hoạt: <b class="text-slate-600">{{ getTriggerName(tl.trigger) }}</b></small>
            </div>
            <div class="mt-1 text-sm italic text-emerald-600">{{ tl.desc }}</div>
          </div>
        </div>
        <div v-else class="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-400">
          🔒 Chưa mở khóa Thiên Phú (yêu cầu hợp nhất đạt cấp V1).
        </div>
      </div>

      <div>
        <div class="mb-2 text-xs font-bold text-amber-600">⚔️ Kỹ Năng (Skills)</div>
        <div v-if="skills.length > 0" class="space-y-2">
          <div v-for="(sk, i) in skills" :key="i" class="rounded-lg border border-slate-200 bg-white p-3">
            <div class="flex justify-between gap-2">
              <span>
                <b>{{ getTypeEmoji(poke.type) }} <RarityText :rarity="sk.rarity" :label="sk.name" /></b>
                <small class="text-slate-500">[{{ sk.rarity || 'Common' }}] ({{ sk.type || 'Skill' }})</small>
              </span>
              <span class="text-xs font-semibold text-amber-600">MP: {{ sk.cost }}</span>
            </div>
            <div class="mt-1 text-xs">
              <span :style="{ color: skillValueText(sk).color }" class="font-semibold">{{ skillValueText(sk).text }}</span>
              <span v-if="sk.effect" class="font-semibold text-emerald-600"> | Hiệu ứng: {{ getEffectLabel(sk.effect) }}</span>
              <small v-if="cdText(sk)" class="text-slate-400"> | {{ cdText(sk) }}</small>
            </div>
          </div>
        </div>
        <div v-else class="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-400">Không có Kỹ Năng.</div>
      </div>
    </div>

    <slot name="footer"></slot>
  </div>
</template>
