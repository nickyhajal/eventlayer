interface IResizeParam {
  target: HTMLTextAreaElement
}
function resize({ target }: IResizeParam): void {
  if (target.value) {
    target.style.height = +target.scrollHeight + 'px'
  } else {
    target.value = ' '
    target.style.height = '1px'
    target.style.height = +target.scrollHeight + 'px'
    target.value = ''
  }
}

export default (el: HTMLTextAreaElement) => {
  resize({ target: el })
  el.style.overflow = 'hidden'
  el.addEventListener('input', (ev: Event) => resize({ target: ev.target as HTMLTextAreaElement }))
  el.addEventListener('change', (ev: Event) => resize({ target: ev.target as HTMLTextAreaElement }))

  return {
    update: () => {
      resize({ target: el })
    },
    destroy: () => {
      el.removeEventListener('input', (ev: Event) =>
        resize({ target: ev.target as HTMLTextAreaElement }),
      )
      el.addEventListener('change', (ev: Event) =>
        resize({ target: ev.target as HTMLTextAreaElement }),
      )
    },
  }
}
