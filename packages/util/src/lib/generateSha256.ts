export async function generateSha256(str: string | undefined) {
  const buffer = new TextEncoder().encode(str)
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
export async function generateSha1(str: string | undefined) {
  const buffer = new TextEncoder().encode(str)
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer)

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // convert bytes to hex string
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
