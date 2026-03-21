export type ScreenBackdropPresetId =
  | 'soft-bokeh'
  | 'bokeh-drift'
  | 'aurora-haze'
  | 'curve-flow'
  | 'ribbon-lines'
  | 'mesh-glow'

export type ScreenBackdropPreset = {
  id: ScreenBackdropPresetId
  label: string
  description: string
}

const PRESET_PREFIX = 'preset:'

export const screenBackdropPresets: ScreenBackdropPreset[] = [
  {
    id: 'soft-bokeh',
    label: 'Soft bokeh',
    description: 'Large blurred light pools that drift slowly across the background.',
  },
  {
    id: 'bokeh-drift',
    label: 'Bokeh drift',
    description: 'A denser field of transparent blur orbs with a little more motion.',
  },
  {
    id: 'aurora-haze',
    label: 'Aurora haze',
    description: 'Wide translucent color bands that feel soft and atmospheric.',
  },
  {
    id: 'curve-flow',
    label: 'Geometric curves',
    description: 'Slow contour-like curves that add structure without feeling busy.',
  },
  {
    id: 'ribbon-lines',
    label: 'Ribbon lines',
    description: 'Fine diagonal ribbons with a subtle, glassy shimmer.',
  },
  {
    id: 'mesh-glow',
    label: 'Mesh glow',
    description: 'Layered radial glows that blend into a calm tonal mesh.',
  },
]

export function encodeScreenBackdropPreset(id: ScreenBackdropPresetId): string {
  return `${PRESET_PREFIX}${id}`
}

export function getScreenBackdropPreset(
  raw: string | null | undefined,
): ScreenBackdropPreset | undefined {
  const value = raw?.trim()
  if (!value?.startsWith(PRESET_PREFIX)) return undefined
  const presetId = value.slice(PRESET_PREFIX.length) as ScreenBackdropPresetId
  return screenBackdropPresets.find((preset) => preset.id === presetId)
}

export function describeScreenBackdrop(raw: string | null | undefined): string {
  const preset = getScreenBackdropPreset(raw)
  if (preset) return preset.label

  const value = raw?.trim()
  if (!value) return 'Plain slate base'
  return `Custom Tailwind: ${value}`
}
