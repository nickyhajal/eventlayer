const isURL = (str) => {
  const urlRegex = /(http[s]?:[:]?\/\/[^\s]+)/g
  return urlRegex.exec(str)
}

const linkify = (link, str, dataId, className) => {
  if (dataId)
    return `<a href="${link}" class="${className}" data-id="${dataId}">${str}</a>`
  else
    return `<a href="${link}" class="${className}" target="_blank">${str}</a>`
}

const makeLinkOrStr = (str: string, count?: number) => {
  if (isURL(str)) {
    const linkStr = count ? str.substring(0, count) : str
    return linkify(str, linkStr, '', '')
  }
  return str
}

export const getContentFromContentArray = (
  value: string,
  contentLimit: number
) => {
  let fullContent = ''
  let limitedContent = '' // this value contains span element, this.text() should be the same as @limitedText
  let limitedText = '' // this value only contains string.
  let isReachedToLimit = false
  const linkStyle =
    'special-interactor bg-[#edf7ff] bg-opacity-50 px-1  py-0.5 rounded-sm text-[#0093ff] no-underline'
  try {
    const parts = JSON.parse(value).reduce((out, curr, i) => {
      if (
        typeof out?.[out.length - 1] === 'string' &&
        typeof curr === 'string'
      ) {
        out[out.length - 1] = `${out[out.length - 1]}\n\n${curr}`
      } else {
        out.push(curr)
      }
      return out
    }, [])
    parts.map((el) => {
      const prevLength = limitedText.length
      let nextLength = 0
      switch (typeof el) {
        case 'string':
          const urlRegex = /(http[s]?:[:]?\/\/[^\s]+)/g
          const splitedByURL = el.split(urlRegex)
          splitedByURL.map((_text) => {
            const _prevLength = limitedText.length
            fullContent += makeLinkOrStr(_text)
            if (contentLimit > _prevLength) {
              nextLength = (limitedText + _text).length
              if (contentLimit > nextLength) {
                limitedContent += makeLinkOrStr(_text)
                limitedText += _text
              } else {
                limitedContent += makeLinkOrStr(
                  _text,
                  contentLimit - _prevLength
                )
                limitedText += _text.substring(0, contentLimit - _prevLength)
                isReachedToLimit = true
              }
            } else {
              isReachedToLimit = true
            }
          })
          break
        case 'object':
          if (el.render === 'none' || !el.type) break
          const userIdLink = `user/${el.id}`
          fullContent += linkify(userIdLink, el.content, el.id, linkStyle)
          if (!isReachedToLimit) {
            nextLength = (limitedText + el.content).length
            if (contentLimit > prevLength) {
              if (contentLimit > nextLength) {
                limitedContent += linkify(
                  userIdLink,
                  el.content,
                  el.id,
                  linkStyle
                )
                limitedText += el.content
              } else {
                limitedContent += linkify(
                  userIdLink,
                  el.content.substring(0, contentLimit - prevLength),
                  el.id,
                  linkStyle
                )
                limitedText += el.content.substring(
                  0,
                  contentLimit - prevLength
                )
                isReachedToLimit = true
              }
            }
          }
          break
      }
    })
  } catch (error) {
    if (typeof value === 'string') {
      fullContent = value
      limitedContent = fullContent.substring(0, contentLimit)
    }
  }
  return {
    fullContent,
    limitedContent,
  }
}
