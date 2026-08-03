<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Cấu hình đạn bay theo hệ Pokémon (phong cách TYPE_VFX của ringward)
// - line: bay thẳng + xoay (cầu lửa / mảnh đá lăn)
// - arc:  bay vòng cung lên (giọt nước / lá rơi)
// - zigzag: phóng giật cục nhấp nháy (chớp điện)
const ELEMENT_FX = {
  Fire: { emoji: '🔥', trail: '#f97316', size: 34, path: 'line', rotate: 360 },
  Water: { emoji: '💧', trail: '#0ea5e9', size: 30, path: 'arc', rotate: 0 },
  Electric: { emoji: '⚡', trail: '#eab308', size: 30, path: 'zigzag', rotate: 0 },
  Grass: { emoji: '🍃', trail: '#22c55e', size: 26, path: 'arc', rotate: -360 },
  Rock: { emoji: '🪨', trail: '#78716c', size: 24, path: 'line', rotate: 360 },
}

const props = defineProps({
  type: { type: String, required: true },
  crit: { type: Boolean, default: false },
  start: { type: Object, required: true },
  end: { type: Object, required: true },
  delay: { type: Number, default: 0 },
  spin: { type: Number, default: 0 },
})

const emit = defineEmits(['done'])

const el = ref(null)
let anim = null

function rotPoint(x, y, rot) {
  return { transform: `translate(${x}px, ${y}px) rotate(${rot}deg)` }
}

function buildKeyframes(fx) {
  const { start, end } = props
  const sx = start.x
  const sy = start.y
  const dx = end.x - sx
  const dy = end.y - sy
  // Lệch pha xoay giữa các hạt (đạn đa hạt: Grass/Rock)
  const spinEnd = fx.rotate + props.spin * 24
  if (fx.path === 'arc') {
    return [
      rotPoint(sx, sy, 0),
      rotPoint(sx + dx / 2, sy + dy / 2 - 30, spinEnd / 2),
      rotPoint(end.x, end.y, spinEnd),
    ]
  }
  if (fx.path === 'zigzag') {
    return [
      rotPoint(sx, sy, 0),
      rotPoint(sx + dx * 0.25, sy + dy * 0.25 - 8, -20),
      rotPoint(sx + dx * 0.5, sy + dy * 0.5 + 8, 20),
      rotPoint(sx + dx * 0.75, sy + dy * 0.75 - 6, -12),
      rotPoint(end.x, end.y, 0),
    ]
  }
  return [rotPoint(sx, sy, 0), rotPoint(end.x, end.y, spinEnd)]
}

onMounted(() => {
  const fx = ELEMENT_FX[props.type] || ELEMENT_FX.Fire
  const node = el.value
  node.style.fontSize = (props.crit ? fx.size * 1.35 : fx.size) + 'px'
  // Vệt sáng đuôi đạn (mạnh hơn khi crit)
  node.style.filter = `drop-shadow(0 0 ${props.crit ? 12 : 6}px ${fx.trail})`
  anim = node.animate(buildKeyframes(fx), {
    duration: props.crit ? 380 : 300,
    delay: props.delay,
    easing: 'ease-in-out',
    fill: 'both',
  })
  anim.finished.then(() => emit('done')).catch(() => {})
})

onBeforeUnmount(() => {
  if (anim) anim.cancel()
})
</script>

<template>
  <div ref="el" class="absolute left-0 top-0 leading-none">{{ ELEMENT_FX[type]?.emoji || '✨' }}</div>
</template>
