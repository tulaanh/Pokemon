// Bộ nhớ thông báo Toast + Confirm modal (thay cho alert()/confirm() native)
import { reactive } from 'vue'

let toastId = 0

const toasts = reactive([])

const TOAST_STYLES = {
  success: 'bg-emerald-600',
  info: 'bg-sky-600',
  warning: 'bg-amber-600',
  error: 'bg-red-600',
}

const TOAST_ICONS = {
  success: '✅',
  info: '💡',
  warning: '⚠️',
  error: '❌',
}

export function showToast(message, type = 'success', duration = 3500) {
  const id = ++toastId
  toasts.push({ id, message, type, icon: TOAST_ICONS[type] || TOAST_ICONS.info, style: TOAST_STYLES[type] || TOAST_STYLES.info })
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration)
  }
}

export function dismissToast(id) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}

// --- Confirm modal ---
const confirmState = reactive({
  open: false,
  title: 'Xác nhận',
  message: '',
  okText: 'Đồng ý',
  cancelText: 'Hủy',
  danger: false,
  _resolve: null,
})

// Trả về Promise<boolean>. Cách dùng: if (await confirmModal('Bạn có chắc?', 'Xác nhận')) { ... }
export function confirmModal(message, options = {}) {
  confirmState.open = true
  confirmState.message = message
  confirmState.title = options.title || 'Xác nhận'
  confirmState.okText = options.okText || 'Đồng ý'
  confirmState.cancelText = options.cancelText || 'Hủy'
  confirmState.danger = !!options.danger
  return new Promise((resolve) => {
    confirmState._resolve = resolve
  })
}

export function resolveConfirm(val) {
  confirmState.open = false
  if (confirmState._resolve) {
    confirmState._resolve(val)
    confirmState._resolve = null
  }
}

export { toasts, confirmState }
