<script setup>
// Hiển thị sprite Pokémon từ public/images/pokemon/{name}.png.
// Nếu ảnh chưa có / tải lỗi → tự fallback sang emoji theo hệ, UI không bao giờ vỡ.
import { ref, computed, watch } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  type: { type: String, default: '' },
  sizeClass: { type: String, default: 'h-12 w-12' },
  rounded: { type: String, default: 'rounded-full' },
  // Official artwork có nền trắng → dùng multiply để "trong suốt" trên nền sáng
  blend: { type: Boolean, default: true },
  imgClass: { type: String, default: '' },
})

const TYPE_EMOJI = {
  Fire: '🔥',
  Water: '💧',
  Electric: '⚡',
  Grass: '🌿',
  Rock: '🪨',
}

const failed = ref(false)

watch(
  () => props.name,
  () => {
    failed.value = false
  },
)

const fallbackEmoji = computed(() => TYPE_EMOJI[props.type] || '❓')
</script>

<template>
  <div class="flex shrink-0 items-center justify-center overflow-hidden bg-white/70" :class="[sizeClass, rounded]">
    <img
      v-if="!failed && name"
      :key="name"
      :src="`/images/pokemon/${name}.png`"
      :alt="name"
      loading="lazy"
      class="object-contain"
      :class="[imgClass, blend ? 'mix-blend-multiply' : '']"
      @error="failed = true"
    />
    <span v-else class="flex items-center justify-center text-center leading-none" :class="sizeClass">{{ fallbackEmoji }}</span>
  </div>
</template>
