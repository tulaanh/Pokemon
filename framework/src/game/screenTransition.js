// Bộ nhớ màn hình chuyển cảnh / loading (thay cho loader thủ công ở từng view)
// Dùng kèm component ScreenTransition.vue. begin/end được đếm tham chiếu nên
// các lần mở lồng nhau (App + WorldMap) sẽ tự cân bằng, overlay chỉ ẩn khi hết.
import { reactive } from 'vue'

const screenTransition = reactive({
  active: false, // overlay đang hiển thị
  label: 'Đang chuyển cảnh...',
  progress: null, // null = spinner, còn lại = 0..100 (hiện thanh tiến trình)
  minDuration: 0, // thời gian tối thiểu hiển thị (ms) — đảm bảo không flash quá nhanh
})

let openCount = 0
let openedAt = 0
let hideTimer = null

export function beginScreenTransition({ label, progress = null, minDuration = 0 } = {}) {
  if (openCount === 0) {
    screenTransition.active = true
    openedAt = Date.now()
    screenTransition.progress = progress
    screenTransition.minDuration = 0
  }
  if (label !== undefined) screenTransition.label = label
  if (progress !== null) screenTransition.progress = progress
  if (minDuration > 0) screenTransition.minDuration = Math.max(screenTransition.minDuration, minDuration)
  openCount++
  clearTimeout(hideTimer)
  hideTimer = null
}

export function setScreenProgress(p) {
  screenTransition.progress = Math.max(0, Math.min(100, Math.round(p)))
}

export function endScreenTransition() {
  if (openCount <= 0) return
  openCount--
  if (openCount > 0) return
  clearTimeout(hideTimer)
  const elapsed = Date.now() - openedAt
  const wait = Math.max(0, screenTransition.minDuration - elapsed)
  const hide = () => {
    screenTransition.active = false
    screenTransition.progress = null
    screenTransition.minDuration = 0
  }
  if (wait > 0) hideTimer = setTimeout(hide, wait)
  else hide()
}

// Mở overlay → chạy task → đóng (đảm bảo hiển thị tối thiểu `minDuration` ms)
export async function withScreenTransition(task, { label, minDuration = 300, progress = null } = {}) {
  beginScreenTransition({ label, minDuration, progress })
  try {
    return await task()
  } finally {
    endScreenTransition()
  }
}

export { screenTransition }
