<script setup>
import { ref, watch, computed } from 'vue'
import { generateSkillInstance } from '../../game/gacha.js'
import { getEffectLabel } from '../../game/data.js'
import RarityText from '../RarityText.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  poke: { type: Object, default: null },
  skillGroups: { type: Array, default: () => [] }, // ['Basic', 'Skill1'] hoặc ['Skill1', 'Skill1'] hoặc ['Basic', 'Skill1', 'Skill2', 'Ultimate']
  level: { type: Number, default: 0 }, // mốc level hiện tại (5, 10, 15, 30, 35+)
  title: { type: String, default: '🔥 CHỌN HỌC KỸ NĂNG MỚI' },
})

const emit = defineEmits(['close', 'learned'])

const RANDOM_GROUPS = ['Basic', 'Skill1', 'Skill2', 'Ultimate']

const options = ref([])
const pendingNewSkill = ref(null)

// Sau khi học đủ 4 skill thì lựa chọn tiếp theo là tổ hợp ngẫu nhiên 4 loại
const hasFullSkills = computed(() => (props.poke ? props.poke.skills.length >= 4 : false))

// Bước 2: chỉ liệt kê các skill CÙNG NHÓM để thay thế (không thêm ô mới)
const replaceCandidates = computed(() => {
  if (!props.poke || !pendingNewSkill.value) return []
  return props.poke.skills
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => s.type === pendingNewSkill.value.type)
})

function groupLabel(g) {
  const labels = { Basic: 'Chiêu Cơ Bản', Skill1: 'Chiêu 1', Skill2: 'Chiêu 2', Ultimate: 'Tuyệt Kỹ' }
  return labels[g] || g
}

function getTitleByLevel(level) {
  const titles = {
    5: '🌱 CHỌN HỌC KỸ NĂNG CẤP 5 (Basic / Skill 1)',
    10: '⚡ CHỌN HỌC KỸ NĂNG CẤP 10 (Skill 1)',
    15: '🔓 MỞ KHÓA SKILL 2 - CHỌN HỌC',
    20: '⚔️ CHỌN HỌC KỸ NĂNG CẤP 20 (Skill 2)',
  }
  if (level >= 30 && level % 5 === 0) return '🎲 CHỌN HỌC KỸ NĂNG NGẪU NHIÊN (4 nhóm, có thể trùng)'
  return titles[level] || '🔥 CHỌN HỌC KỸ NĂNG MỚI'
}

function reset() {
  options.value = []
  pendingNewSkill.value = null
}

// Initialize options when modal opens or when props change
function initOptions() {
  if (props.open && props.poke && props.skillGroups.length > 0) {
    options.value = []
    // Tạo options dựa trên skillGroups từ props (mỗi group tạo 1 skill instance)
    for (const group of props.skillGroups) {
      options.value.push(
        generateSkillInstance(props.poke.type, group, props.poke.rarity, props.poke.level)
      )
    }
    pendingNewSkill.value = null
  } else {
    reset()
  }
}

watch(
  () => props.open,
  (open) => {
    initOptions()
  },
  { immediate: true }
)

// Also re-initialize if poke or skillGroups change while open
watch(
  () => [props.poke, props.skillGroups],
  () => {
    if (props.open) {
      initOptions()
    }
  },
  { deep: true }
)

function skillValueText(sk) {
  if (sk.power) return `Sát thương: ${sk.power}`
  if (sk.shield) return `Khiên: +${sk.shield}`
  if (sk.heal) return `Hồi máu: +${sk.heal}`
  return 'Kỹ năng Buff'
}

// Bước 1: chọn 1 trong các kỹ năng mới
// - Nếu Pokémon CHƯA có skill cùng nhóm => MỞ ô kỹ năng mới (Slot 3 ở Lv.15, Slot 4 ở Lv.30)
// - Nếu ĐÃ có skill cùng nhóm => chọn skill cũ cùng nhóm để THAY THẾ (không thêm ô mới)
function chooseOption(sk) {
  let hasSameType = props.poke.skills.some((s) => s.type === sk.type)
  if (!hasSameType) {
    props.poke.skills.push(sk)
    emit('learned', `🔓 ${props.poke.name} đã MỞ KHÓA ô kỹ năng ${props.poke.skills.length} và học: ${sk.name}!`)
  } else {
    pendingNewSkill.value = sk
  }
}

// Bước 2 (đã có skill cùng nhóm): chọn 1 kỹ năng cũ để quên
function confirmReplace(replaceIdx) {
  let oldSkName = props.poke.skills[replaceIdx].name
  props.poke.skills[replaceIdx] = pendingNewSkill.value
  emit('learned', `🔄 ${props.poke.name} đã thay thế [${oldSkName}] bằng [${pendingNewSkill.value.name}]!`)
}

// Không học kỹ năng mới (chỉ hiển thị khi đã đủ 4 skill và ở mốc 35+)
function skipLearn() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="emit('close')">
      <div class="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 class="text-base font-bold text-amber-600">{{ title }}</h3>
          <button class="text-2xl leading-none text-slate-400 hover:text-slate-600" @click="emit('close')">&times;</button>
        </div>

        <div class="flex-1 space-y-3 overflow-y-auto p-4">
          <!-- KỸ NĂNG HIỆN TẠI -->
          <div v-if="hasFullSkills && !pendingNewSkill" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="mb-2 text-center text-xs font-bold text-slate-500">📚 KỸ NĂNG HIỆN TẠI</p>
            <div
              v-for="(oldSk, idx) in poke.skills"
              :key="'cur-' + idx"
              class="mb-1 flex items-start justify-between gap-2 text-xs"
            >
              <span class="shrink-0 text-slate-400">Ô {{ idx + 1 }}:</span>
              <RarityText :rarity="oldSk.rarity">[{{ oldSk.rarity || 'Common' }}] {{ oldSk.name }}</RarityText>
              <small class="shrink-0 text-slate-400">{{ groupLabel(oldSk.type) }}</small>
            </div>
          </div>

          <!-- BƯỚC 1: CHỌN KỸ NĂNG MỚI -->
          <template v-if="!pendingNewSkill">
            <p v-if="poke" class="mb-2 text-center text-sm text-slate-500">
              {{ poke.name }} (Hệ {{ poke.type }}) — chọn 1 kỹ năng để học:
            </p>
            <button
              v-for="(sk, i) in options"
              :key="'opt-' + i + sk.name"
              @click="chooseOption(sk)"
              class="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:bg-slate-50"
            >
              <RarityText :rarity="sk.rarity" class="text-sm font-bold">[{{ sk.rarity }}] {{ sk.name }}</RarityText>
              <small class="text-slate-500"> ({{ groupLabel(sk.type) }} - Hệ {{ poke?.type }})</small>
              <div class="mt-1 text-xs text-amber-600">
                {{ skillValueText(sk) }}<template v-if="sk.effect"> | Hiệu ứng: {{ getEffectLabel(sk.effect) }}</template>
              </div>
              <small class="text-slate-500">MP: {{ sk.cost }} | CD: {{ sk.cd }}t</small>
            </button>

            <!-- KHÔNG HỌC KỸ NĂNG MỚI -->
            <button
              v-if="hasFullSkills"
              @click="skipLearn"
              class="w-full rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              ⏭️ Không học kỹ năng mới
            </button>
          </template>

          <!-- BƯỚC 2: CHỌN KỸ NĂNG CŨ CÙNG NHÓM ĐỂ THAY THẾ -->
          <template v-else>
            <p class="mb-2 text-center text-sm text-slate-500">
              Pokémon đã có skill nhóm
              <b class="text-slate-700">{{ groupLabel(pendingNewSkill.type) }}</b>. Chọn skill cũ để
              <b class="text-red-500">THAY THẾ</b> bằng
              <b><RarityText :rarity="pendingNewSkill.rarity">[{{ pendingNewSkill.rarity }}] {{ pendingNewSkill.name }}</RarityText></b>
              (không mở thêm ô mới):
            </p>
            <button
              v-for="({ s: oldSk, idx }) in replaceCandidates"
              :key="idx"
              @click="confirmReplace(idx)"
              class="w-full rounded-xl border border-red-300 bg-white p-3 text-left transition hover:bg-red-50"
            >
              <span class="text-sm font-bold text-red-500">❌ Ô {{ idx + 1 }}:</span>
              <RarityText :rarity="oldSk.rarity"> [{{ oldSk.rarity || 'Common' }}] {{ oldSk.name }}</RarityText>
              <div class="mt-1 text-xs text-amber-600">{{ skillValueText(oldSk) }}</div>
              <small class="text-slate-500">MP: {{ oldSk.cost }} | CD: {{ oldSk.cd }}t</small>
            </button>

            <button
              @click="pendingNewSkill = null"
              class="w-full rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
            >
              ← Quay lại
            </button>
          </template>
        </div>

        <button @click="emit('close')" class="bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200">
          Đóng
        </button>
      </div>
    </div>
  </Teleport>
</template>
