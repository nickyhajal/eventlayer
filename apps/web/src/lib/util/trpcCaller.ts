import { writable, type Writable } from 'svelte/store'

type InferArgs<T> = T extends (...t: [...infer Arg]) => unknown ? Arg : never
export function trpcCaller<T extends (...args: any[]) => any>(
  endpoint: T,
  opts: {
    store: Writable<InferArgs<T>> | false
    successDelay: number
    saveFilter: false | ((...args: InferArgs<T>) => false | InferArgs<T>)
  } = { store: false, successDelay: 1000, saveFilter: false },
) {
  const { successDelay } = opts
  const status = writable('ready')
  const hasError = writable(false)
  const error = writable('')
  const loading = writable(false)
  async function call(...args: InferArgs<T>): Promise<ReturnType<T> | false> {
    // validation of opts?.validation
    status.set('saving')
    loading.set(true)
    try {
      const res = await endpoint(...args)
      status.set('success')
      if (successDelay) {
        setTimeout(() => status.set('ready'), successDelay)
      }
      return res
    } catch (e) {
      status.set('error')
      hasError.set(true)
      error.set(e.message)
    } finally {
      loading.set(false)
    }
    return false
  }
  function enhance(el: HTMLFormElement) {
    el.addEventListener(
      'submit',
      (e) => {
        console.log('go')
      },
      false,
    )
    return {
      update: (updatedParameter: any) => {
        console.log('update')
      },
      destroy: () => {
        console.log('destroy')
      },
    }
  }
  if (opts) {
    const { store } = opts
    if (store) {
      store.subscribe((value: InferArgs<T>) => {
        if (opts.saveFilter) {
          const filtered = opts.saveFilter(...value)
          if (filtered) {
            call(...filtered)
          }
        } else {
          call(...value)
        }
      })
    }
  }
  return {
    loading,
    hasError,
    status,
    call,
    enhance,
  }
}
