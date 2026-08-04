// State modal Cài Đặt (mở được từ bất kỳ đâu — bản đồ, header, ...)
import { reactive } from 'vue'

const settingsModalState = reactive({ open: false })

export function openSettings() {
  settingsModalState.open = true
}

export function closeSettings() {
  settingsModalState.open = false
}

export { settingsModalState }
