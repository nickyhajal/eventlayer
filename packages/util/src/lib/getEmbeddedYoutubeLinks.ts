export const getEmbeddedYoutubeLinks = (str: string) => {
  // const urlRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g
  const urlRegex =
    /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/gi
  const idRegex =
    /https?:\/\/(?:[0-9A-Z-]+\.)?.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
  const urls = str.match(urlRegex)
  let embed_urls: string[] = []
  if (urls) {
    urls.map((url) => {
      const tmp = url.match(idRegex)
      const id = tmp[1]
      embed_urls.push(`https://youtube.com/embed/${id}`)
    })
  }
  return embed_urls
}
