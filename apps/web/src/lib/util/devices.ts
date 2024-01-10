import { writable, get } from 'svelte/store'
export const device = writable()
export const isPhone = writable(false)
export const isTablet = writable(false)
export const isDesktop = writable(true)
export const isMobile = writable(false)
export const updateDevice = (deviceWidth: number) => {
  if (deviceWidth > 810) {
    isPhone.set(false)
    isTablet.set(false)
    isMobile.set(false)
    isDesktop.set(true)
    device.set('desktop')
  } else if (deviceWidth > 550) {
    isPhone.set(false)
    isTablet.set(true)
    isMobile.set(true)
    isDesktop.set(false)
    device.set('tablet')
  } else {
    isPhone.set(true)
    isTablet.set(false)
    isMobile.set(true)
    isDesktop.set(false)
    device.set('phone')
  }
}
