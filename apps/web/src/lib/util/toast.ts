import toast, { type ToastPosition } from 'svelte-french-toast'

export class Toast {
  static success(message: string, position: ToastPosition = 'bottom-right') {
    toast.success(message, {
      position,
    })
  }

  static error(message: string, position: ToastPosition = 'bottom-right') {
    toast.error(message, {
      position,
    })
  }
}
