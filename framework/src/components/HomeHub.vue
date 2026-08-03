<script setup>
defineProps({
  categories: {
    type: Array,
    required: true, // [{ id, icon, label, desc, modes: [{ id, icon, label }] }]
  },
})

const emit = defineEmits(['open'])
</script>

<template>
  <div>
    <div class="mb-5 text-center">
      <h2 class="text-2xl font-black text-slate-800">🎮 Khu Vui Chơi Pokémon</h2>
      <p class="mt-1 text-sm text-slate-500">Chọn một mục lớn bên dưới, rồi bấm vào icon để bắt đầu!</p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div v-for="cat in categories" :key="cat.id" class="app-card p-5">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-fuchsia-500 text-2xl shadow-md shadow-fuchsia-500/20">
            {{ cat.icon }}
          </div>
          <div class="min-w-0">
            <h3 class="text-base font-bold text-slate-800">{{ cat.label }}</h3>
            <p class="text-[11px] text-slate-500">{{ cat.desc }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <button
            v-for="mode in cat.modes"
            :key="mode.id"
            @click="emit('open', mode.id)"
            class="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 transition hover:border-amber-400 hover:bg-amber-50 hover:shadow-md"
          >
            <span class="text-2xl">{{ mode.icon }}</span>
            <span class="text-xs font-bold text-slate-700">{{ mode.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
