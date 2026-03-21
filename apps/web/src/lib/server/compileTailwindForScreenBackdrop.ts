import autoprefixer from 'autoprefixer'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

import screenJit from '../../../tailwind.screen-jit.config.js'

/** Allowed characters in a Tailwind class list (prevents breaking out of HTML/CSS context). */
const TAILWIND_CLASS_STRING_RE = /^[a-zA-Z0-9_\-[\]:.,/%#+()!\s@]+$/u

const MAX_LEN = 800
const CACHE_MAX = 48
const cache = new Map<string, string>()

function evictCacheIfNeeded() {
  while (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value
    if (first === undefined) break
    cache.delete(first)
  }
}

/**
 * Tailwind v4 renamed linear gradients to `bg-linear-to-*`; v3 (what we compile with) uses `bg-gradient-to-*`.
 */
function normalizeV4LinearGradientTokens(classString: string): string {
  return classString
    .split(/\s+/)
    .filter(Boolean)
    .map((token) =>
      token.startsWith('bg-linear-to-')
        ? `bg-gradient-to-${token.slice('bg-linear-to-'.length)}`
        : token,
    )
    .join(' ')
}

/**
 * Returns a safe class string for Tailwind JIT, or null if input is invalid.
 */
export function sanitizeScreenBackdropClasses(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (t.length > MAX_LEN) return null
  if (!TAILWIND_CLASS_STRING_RE.test(t)) return null
  return t.replaceAll('"', '').replaceAll("'", '').replaceAll('`', '')
}

/**
 * Sanitize + map v4-style gradient class names to v3. Use this for both JIT compilation and the DOM `class` on the screen.
 */
export function prepareScreenBackdropClasses(raw: string): string | null {
  const safe = sanitizeScreenBackdropClasses(raw)
  if (!safe) return null
  return normalizeV4LinearGradientTokens(safe)
}

/**
 * Compiles only the utilities referenced in `classString` using a minimal Tailwind config
 * (see `tailwind.screen-jit.config.js`). Cached in-memory per unique class string.
 */
export async function compileTailwindForScreenBackdrop(classString: string): Promise<string> {
  const raw = classString.trim() || 'bg-slate-950'
  const prepared = prepareScreenBackdropClasses(raw) ?? 'bg-slate-950'

  const cached = cache.get(prepared)
  if (cached !== undefined) return cached

  const result = await postcss([
    tailwindcss({
      ...screenJit,
      content: [
        {
          raw: `<div class="${prepared}"></div>`,
          extension: 'html',
        },
      ],
    }),
    autoprefixer(),
  ]).process('@tailwind utilities;', { from: undefined })

  /** Matches Tailwind preflight so gradient utilities work without relying on load order vs app.css */
  const gradientVarReset =
    '*,::before,::after{--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;}'

  const css = `${gradientVarReset}\n${result.css.trim()}`
  cache.set(prepared, css)
  evictCacheIfNeeded()
  return css
}
