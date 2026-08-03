// ==========================================
// COMPOSABLE ANIMATION CHIẾN ĐẤU
// Đọc hàng đợi `battle.fxQueue` (do game/battle.js phát) và chơi hiệu ứng
// tuần tự: sprite lao tới -> trúng đòn -> số sát thương bay lên -> HP tụt.
// HP hiển thị là SNAPSHOT trễ (không đọc trực tiếp state) để khớp nhịp phim.
// ==========================================
import { reactive, ref, watch, onBeforeUnmount } from 'vue'
import { battle, getActivePlayerPoke } from '../../game/battle.js'

// Burst hiệu ứng theo hệ Pokémon
const TYPE_BURST = {
  Fire: { emoji: '🔥', color: '#f97316' },
  Water: { emoji: '💧', color: '#0ea5e9' },
  Electric: { emoji: '⚡', color: '#eab308' },
  Grass: { emoji: '🌿', color: '#22c55e' },
  Rock: { emoji: '🪨', color: '#78716c' },
}

export function useBattleFx(playerPokeRef, spriteRefs = {}) {
  const shownPlayerHpPct = ref(100)
  const shownEnemyHpPct = ref(100)
  const playerAnim = reactive({ name: '', side: 'player', key: 0 })
  const enemyAnim = reactive({ name: '', side: 'bot', key: 0 })
  const impactFx = reactive({ side: null, casterType: '', crit: false, key: 0 })
  const statusFx = reactive({ side: null, text: '', key: 0 })
  const shaking = ref(false)
  const floatingNums = ref([])
  const projectiles = ref([])
  const processing = ref(false)

  let alive = true
  let numId = 0
  let projId = 0
  let timers = []

  // Lấy điểm giữa sprite (tâm) quy về tọa độ tương đối battlefield overlay
  function centerPoint(el, jitter = 0) {
    const bf = spriteRefs.battlefieldEl ? spriteRefs.battlefieldEl.value : null
    if (!bf || !el) return { x: 0, y: 0 }
    const br = bf.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    return {
      x: r.left + r.width / 2 - br.left + (Math.random() * 2 - 1) * jitter,
      y: r.top + r.height / 2 - br.top + (Math.random() * 2 - 1) * jitter,
    }
  }

  // Spawn đạn bay từ sprite người ra đòn -> sprite mục tiêu
  function spawnProjectile(ev) {
    const fromEl =
      ev.casterSide === 'player' ? spriteRefs.playerSpriteEl : spriteRefs.enemySpriteEl
    const toEl = ev.side === 'player' ? spriteRefs.playerSpriteEl : spriteRefs.enemySpriteEl
    if (!spriteRefs.battlefieldEl || !fromEl?.value || !toEl?.value) return
    const start = centerPoint(fromEl.value)
    const end = centerPoint(toEl.value)
    const type = ev.casterType || 'Fire'
    // Grass = 3 lá xoay, Rock = 2 mảnh đá lăn, còn lại 1 đạn
    const count = type === 'Grass' ? 3 : type === 'Rock' ? 2 : 1
    for (let i = 0; i < count; i++) {
      projectiles.value.push({
        id: ++projId,
        type,
        crit: !!ev.crit,
        start: i === 0 ? start : centerPoint(fromEl.value, 8),
        end: i === 0 ? end : centerPoint(toEl.value, 10),
        delay: i * 45,
        spin: i,
      })
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      if (!alive) return resolve()
      const t = setTimeout(resolve, ms)
      timers.push(t)
    })
  }

  function hpPctOf(p) {
    if (!p || !p.maxHp) return 0
    return Math.max(0, Math.round((Math.max(0, p.hp) / p.maxHp) * 100))
  }

  function liveHp(side) {
    return side === 'player' ? hpPctOf(getActivePlayerPoke()) : hpPctOf(battle.enemyPoke)
  }

  function syncShownHp() {
    shownPlayerHpPct.value = liveHp('player')
    shownEnemyHpPct.value = liveHp('bot')
  }

  function setAnim(side, name) {
    const t = side === 'player' ? playerAnim : enemyAnim
    t.name = ''
    t.side = side
    t.key++
    requestAnimationFrame(() => {
      if (!alive) return
      t.name = name
    })
  }

  function clearAnim(side) {
    const t = side === 'player' ? playerAnim : enemyAnim
    t.name = ''
  }

  function pushNum(side, text, cls) {
    const id = ++numId
    floatingNums.value.push({ id, side, text, cls })
    const t = setTimeout(() => {
      floatingNums.value = floatingNums.value.filter((n) => n.id !== id)
    }, 1000)
    timers.push(t)
  }

  function setStatus(side, text) {
    statusFx.side = side
    statusFx.text = text
    statusFx.key++
  }

  function shakeScreen() {
    shaking.value = false
    requestAnimationFrame(() => {
      shaking.value = true
      const t = setTimeout(() => {
        shaking.value = false
      }, 420)
      timers.push(t)
    })
  }

  function burstFor(type) {
    return TYPE_BURST[type] || { emoji: '✨', color: '#94a3b8' }
  }

  async function playEvent(ev) {
    switch (ev.type) {
      case 'attack': {
        // 1. Người ra đòn lao tới
        setAnim(ev.casterSide, 'lunge')
        await sleep(120)
        // 1b. Đạn bay theo hệ từ caster -> target (thời gian bay ~320ms)
        spawnProjectile(ev)
        await sleep(320)
        // 2. Trúng đòn: burst theo hệ + rung lắc mục tiêu
        impactFx.side = ev.side
        impactFx.casterType = ev.casterType
        impactFx.crit = !!ev.crit
        impactFx.key++
        if (ev.crit) shakeScreen()
        setAnim(ev.side, 'hit')
        if (ev.side === 'player') shownPlayerHpPct.value = ev.hpPct
        else shownEnemyHpPct.value = ev.hpPct
        pushNum(ev.side, `-${ev.dmg}`, ev.crit ? 'num-crit' : 'num-dmg')
        if (ev.shield > 0) pushNum(ev.side, `-${ev.shield} Khiên`, 'num-shield')
        await sleep(380)
        // 3. Hạ gục: sprite chìm dần
        if (ev.ko) {
          impactFx.side = null
          setAnim(ev.side, 'ko')
          await sleep(550)
        } else {
          impactFx.side = null
          clearAnim(ev.side)
        }
        clearAnim(ev.casterSide)
        break
      }
      case 'heal': {
        setAnim(ev.side, 'glow')
        if (ev.side === 'player') shownPlayerHpPct.value = ev.hpPct
        else shownEnemyHpPct.value = ev.hpPct
        pushNum(ev.side, `+${ev.amount}`, 'num-heal')
        await sleep(450)
        clearAnim(ev.side)
        break
      }
      case 'shield': {
        setAnim(ev.side, 'glow')
        pushNum(ev.side, `+${ev.amount} Khiên`, 'num-shield')
        await sleep(450)
        clearAnim(ev.side)
        break
      }
      case 'dot': {
        setAnim(ev.side, 'hit')
        if (ev.side === 'player') shownPlayerHpPct.value = ev.hpPct
        else shownEnemyHpPct.value = ev.hpPct
        pushNum(ev.side, `-${ev.dmg}`, 'num-dot')
        await sleep(300)
        clearAnim(ev.side)
        break
      }
      case 'reflect': {
        if (ev.side === 'player') shownPlayerHpPct.value = ev.hpPct
        else shownEnemyHpPct.value = ev.hpPct
        pushNum(ev.side, `-${ev.dmg}`, 'num-reflect')
        await sleep(350)
        break
      }
      case 'status': {
        setStatus(ev.side, ev.resisted ? `🛡️ Kháng ${ev.name}` : `✨ ${ev.name}`)
        await sleep(1000)
        statusFx.side = null
        break
      }
      case 'stunned': {
        setStatus(ev.side, '😵 Choáng!')
        await sleep(900)
        statusFx.side = null
        break
      }
    }
  }

  // Bơm tuần tự từng sự kiện trong hàng đợi
  async function pump() {
    if (processing.value) return
    processing.value = true
    while (battle.fxQueue.length) {
      const ev = battle.fxQueue.shift()
      // Tắt animation -> dồn hàng đợi, cập nhật HP tức thì
      if (!battle.fxEnabled) {
        syncShownHp()
        continue
      }
      await playEvent(ev)
    }
    processing.value = false
    // Sự kiện vừa tới trong lúc đang xử lý -> chạy tiếp
    if (battle.fxQueue.length && alive) pump()
  }

  watch(() => battle.fxQueue.length, pump)

  watch(
    () => battle.fxEnabled,
    (val) => {
      if (!val) {
        battle.fxQueue = []
        projectiles.value = []
        syncShownHp()
      }
    },
  )

  // Đổi Pokémon -> xuất trận + đồng bộ HP
  watch(
    playerPokeRef,
    (nv, ov) => {
      if (nv !== ov) {
        shownPlayerHpPct.value = hpPctOf(nv)
        setAnim('player', 'appear')
      }
    },
    { immediate: true },
  )

  watch(
    () => battle.enemyPoke,
    (nv, ov) => {
      if (nv !== ov) {
        shownEnemyHpPct.value = hpPctOf(nv)
        setAnim('bot', 'appear')
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    alive = false
    battle.fxQueue = []
    projectiles.value = []
    timers.forEach((t) => clearTimeout(t))
    timers = []
  })

  return {
    shownPlayerHpPct,
    shownEnemyHpPct,
    playerAnim,
    enemyAnim,
    impactFx,
    statusFx,
    shaking,
    floatingNums,
    projectiles,
    burstFor,
  }
}
