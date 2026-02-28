import { writable } from 'svelte/store'

interface IStack {
  type?: string
  confirmationTitle: string
  confirmationText: string
  confirmationButtonClass?: string
  confirmationLabel?: string
  cancelButtonClass?: string
  cancelLabel?: string
  handleConfirm: () => any
}

class Confirmations {
  stack: IStack[] = []
  subscribe
  set;

  constructor() {
    const { subscribe, set } = writable(this)
    this.subscribe = subscribe
    this.set = set
  }
  update() {
    this.set(this)
  }
  add(
    confirmation: IStack = {
      type: 'confirmation',
      confirmationTitle: 'Are you sure you want to delete this?',
      confirmationText: '',
      confirmationButtonClass: '',
      confirmationLabel: 'Delete',
      cancelButtonClass: '',
      cancelLabel: 'Delete',
      handleConfirm: () => {},
    },
  ) {
    this.stack.push(confirmation)
    this.update()
  }
  pop() {
    this.stack.pop()
    this.update()
  }
}

export const confirmations = new Confirmations()
