// ==========================================
// KÉO KẺ Ô CHỌN (RUBBER BAND) CHO CHẾ ĐỘ BÁN NHANH
// ==========================================
// - Gắn onDown vào container grid (chỉ kích hoạt khi isEnabled.value = true).
// - Dùng Pointer Events (hỗ trợ cả chuột + cảm ứng), vẽ ô chọn xanh theo vị trí
//   con trỏ; khi thả, dùng getBoundingClientRect của từng thẻ (Map uid -> element)
//   để tìm thẻ giao với ô chọn.
// - Di chuyển < 5px => coi là click (view tự toggle); ngược lại gọi onBatchSelect(ids)
//   và set justDragged để chặn sự kiện click phát sinh ngay sau đó.
// - Lưu ý: cần kèm @dragstart.prevent ở container để chặn native drag của ảnh
//   (PokeSprite là <img> kéo được mặc định) — nếu không, browser nuốt mousemove
//   và vùng kéo không hoạt động.
import { ref } from 'vue'

export function useRubberBandSelect(getCardEls, isEnabled, onBatchSelect) {
  const rect = ref(null)
  const justDragged = ref(false)

  let active = false
  let dragging = false
  let startX = 0
  let startY = 0

  function onDown(e) {
    if (!isEnabled.value) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    active = true
    dragging = false
    justDragged.value = false
    startX = e.clientX
    startY = e.clientY
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function onMove(e) {
    if (!active) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (!dragging && Math.hypot(dx, dy) < 5) return
    dragging = true
    rect.value = {
      left: Math.min(startX, e.clientX),
      top: Math.min(startY, e.clientY),
      width: Math.abs(dx),
      height: Math.abs(dy),
    }
  }

  function onUp() {
    if (!active) return
    active = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)

    if (!dragging) {
      rect.value = null
      return
    }

    justDragged.value = true
    const r = rect.value
    rect.value = null

    const ids = []
    const els = getCardEls()
    const pairs = els instanceof Map ? Array.from(els.entries()) : Object.entries(els)
    pairs.forEach(([uid, el]) => {
      if (!el) return
      const br = el.getBoundingClientRect()
      if (br.right > r.left && br.left < r.left + r.width && br.bottom > r.top && br.top < r.top + r.height) {
        ids.push(uid)
      }
    })
    if (ids.length > 0 && onBatchSelect) onBatchSelect(ids)
  }

  return { rect, justDragged, onDown }
}
