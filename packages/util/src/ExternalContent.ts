export function getExternalUrl(url: string) {
  if (!url.includes('http')) {
    url = `https://${url}`
  }
  return url
}

export class ExternalContent {
  id: string
  type: string
  subtype: string
  autoplay: boolean = false
  url: string
  title: string
  links: string
  externalUrl?: string = ''
  embed?: string = ''
  code: string = ''
  description: string
  timerRequired: boolean
  isExternal: boolean
  isEmbeddable: boolean
  constructor({
    id,
    subtype,
    type,
    url,
    title,
    links,
    description,
    timerRequired,
    autoplay = false,
  }: ExternalContent) {
    this.id = id
    this.type = type
    this.subtype = subtype
    this.url = url
    this.title = title
    this.links = links
    this.description = description
    this.timerRequired = timerRequired
    this.isExternal = this.subtype !== 'content'
    this.isEmbeddable = this.isExternal && this.subtype !== 'link'
    this.autoplay = autoplay
    if (!this.subtype) {
      this.subtype = this.getType()
    }
    this.getCode()
    if (this.isExternal) {
      this.externalUrl = this.getUrlFromType()
    }
    if (this.isEmbeddable) {
      this.embed = this.getEmbedFromType()
    }
  }
  getType() {
    if (this.url.includes('youtube.com')) {
      return 'youtube'
    } else if (this.url.includes('loom.com')) {
      return 'loom'
    } else if (this.url.includes('vimeo.com')) {
      return 'vimeo'
    } else if (this.url.includes('wistia.com')) {
      return 'wistia'
    }
    return 'youtube'
  }
  getCode() {
    let url: URL | undefined
    try {
      url = new URL(this.url)
      let query = new URLSearchParams(url?.search?.replace('?', ''))
      if (this.subtype === 'vimeo' && this.url.includes('vimeo.com')) {
        this.code = url.pathname.split('/')?.pop() || this.url
      } else if (this.subtype === 'youtube') {
        if (url.host === 'youtu.be') {
          this.code = this.url.split('/').pop() || this.code
        } else if (this.url.includes('youtube.com')) {
          this.code = query.get('v') || this.url
        }
      } else if (this.subtype === 'wistia') {
        if (this.url.includes('wistia.com') || this.url.includes('wistia.net')) {
          if (this.url.includes('iframe')) {
            const regex = /embed\/iframe\/([\w-]+)/
            this.code = regex.exec(this.url)[1] || this.code
          } else if (this.url.includes('wistia_embed')) {
            const regex = /medias\/(.+?)\.jsonp/
            const matches = this.url.match(regex)
            if (matches?.[1]) {
              this.code = matches[1]
            }
          } else if (url?.pathname?.includes('medias')) {
            this.code = this.url.split('/').pop() || this.code
          }
        }
      } else if (this.subtype === 'loom') {
        if (this.url.includes('loom.com')) {
          this.code = url.pathname.split('/share/')?.[1] || this.code
        }
      }
    } catch (e) {}
  }
  getEmbedFromType() {
    switch (this.subtype) {
      case 'loom': {
        return `<iframe src="https://www.loom.com/embed/${this.code}?autoplay=${
          this.autoplay ? 1 : 0
        }" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen allow="autoplay; fullscreen; picture-in-picture"  class="absolute top-0 left-0 w-full" style="height: 100%;"></iframe>`
      }
      case 'youtube': {
        return `<iframe  class="absolute top-0 left-0 w-full" style="height:100%;" src="https://www.youtube.com/embed/${
          this.code
        }?autoplay=${
          this.autoplay ? 1 : 0
        }" title="YouTube video player" frameborder="0" allow="accelerometer; fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      }
      case 'vimeo': {
        return `<iframe src="https://player.vimeo.com/video/${this.code}?autoplay=${
          this.autoplay ? 1 : 0
        }"  class="absolute top-0 left-0 w-full" style="height: 100%;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe><script src="https://player.vimeo.com/api/player.js"></script>`
      }
      case 'wistia': {
        this.initWistia()
        return `<div class="wistia_responsive_padding" style="padding:56.25% 0 0 0;position:relative;"><div class="wistia_responsive_wrapper" style="height:100%;left:0;position:absolute;top:0;width:100%;"><div class="wistia_embed wistia_async_${this.url} videoFoam=true" style="height:100%;position:relative;width:100%"><div class="wistia_swatch" style="height:100%;left:0;opacity:0;overflow:hidden;position:absolute;top:0;transition:opacity 200ms;width:100%;"><img src="https://fast.wistia.com/embed/medias/${this.url}/swatch" style="filter:blur(5px);height:100%;object-fit:contain;width:100%;" alt="" aria-hidden="true" onload="this.parentNode.style.opacity=1;" /></div></div></div></div>`
      }
    }
  }
  initWistia() {
    const wistiajs = document.createElement('script')
    wistiajs.setAttribute('src', 'https://fast.wistia.com/assets/external/E-v1.js')
    document.body.appendChild(wistiajs)
    const videoJson = document.createElement('script')
    videoJson.setAttribute('src', `https://fast.wistia.com/embed/medias/${this.code}.jsonp`)
    document.body.appendChild(videoJson)
  }
  getUrlFromType() {
    switch (this.subtype) {
      case 'link': {
        return getExternalUrl(this.url)
      }
      case 'loom': {
        return `https://www.loom.com/share/${this.code}`
      }
      case 'wistia': {
        return `https://fast.wistia.com/embed/medias/${this.code}`
      }
      case 'youtube': {
        return `https://www.youtube.com/watch?v=${this.code}`
      }
      case 'vimeo': {
        return `https://vimeo.com/${this.code}`
      }
    }
  }
}
