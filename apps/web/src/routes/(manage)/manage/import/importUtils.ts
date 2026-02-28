import { parse } from 'csv-parse/browser/esm/sync'

export interface ParsedTable {
  headers: string[]
  rows: Array<Record<string, string>>
}

export interface ColumnMapping {
  firstName: string | null
  lastName: string | null
  email: string | null
  type: string | null
}

export interface ExtraColumnConfig {
  sourceHeader: string
  include: boolean
  key: string
  suggestedKey: string
}

export interface PreviewRow {
  rowNumber: number
  firstName: string
  lastName: string
  email: string
  type: string
  alreadyAttending: boolean
  info: Record<string, string>
  valid: boolean
  errors: string[]
}

export interface NameSplitConfig {
  enabled: boolean
  nameHeader: string | null
}

export interface ImportRowPayload {
  rowNumber: number
  email: string
  firstName?: string
  lastName?: string
  type?: string
  info?: Record<string, string>
}

export interface ImportRunSummary {
  importId: string
  processed: number
  created: number
  updated: number
  skipped: number
}

export interface TypeConfig {
  sourceHeader: string | null
  defaultType: string
  valueMap: Record<string, string>
}

export interface TypeSourceValue {
  sourceValue: string
  normalizedValue: string
}

const FIRST_NAME_ALIASES = new Set([
  'first',
  'first_name',
  'firstname',
  'given',
  'given_name',
  'fname',
  'forename',
])

const LAST_NAME_ALIASES = new Set([
  'last',
  'last_name',
  'lastname',
  'surname',
  'family_name',
  'family',
  'lname',
])

const EMAIL_ALIASES = new Set([
  'email',
  'email_address',
  'e_mail',
  'mail',
  'primary_email',
  'work_email',
])

const TYPE_ALIASES = new Set([
  'type',
  'user_type',
  'attendee_type',
  'role',
  'category',
  'persona',
])

function slugifyHeader(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function normalizeHeader(input: string): string {
  return slugifyHeader(input)
}

export function normalizeTypeValue(input: string): string {
  return slugifyHeader(input)
}

export function detectDelimiter(text: string): string {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!firstLine) return ','
  if (firstLine.includes('\t')) return '\t'

  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length

  return semicolons > commas ? ';' : ','
}

function makeUniqueHeaders(headers: string[]): string[] {
  const used = new Map<string, number>()
  return headers.map((header, index) => {
    const base = header.trim() || `column_${index + 1}`
    const seen = used.get(base) || 0
    used.set(base, seen + 1)
    if (!seen) return base
    return `${base}_${seen + 1}`
  })
}

export function parseTabularText(text: string): ParsedTable {
  if (!text.trim()) {
    throw new Error('No data provided')
  }

  const delimiter = detectDelimiter(text)
  const matrix = parse(text, {
    delimiter,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as string[][]

  if (!matrix.length) {
    throw new Error('No rows found')
  }

  const headers = makeUniqueHeaders(matrix[0].map((value) => `${value ?? ''}`.trim()))
  if (!headers.length) {
    throw new Error('No headers found')
  }

  const rows = matrix
    .slice(1)
    .filter((row) => row.some((value) => `${value ?? ''}`.trim().length > 0))
    .map((row) => {
      const mapped: Record<string, string> = {}
      headers.forEach((header, index) => {
        mapped[header] = `${row[index] ?? ''}`.trim()
      })
      return mapped
    })

  return { headers, rows }
}

function findHeader(
  headers: string[],
  aliases: Set<string>,
  looseMatchers: string[],
  used: Set<string>,
): string | null {
  const available = headers.filter((header) => !used.has(header))
  const normalized = new Map(available.map((header) => [header, normalizeHeader(header)]))

  const exact = available.find((header) => aliases.has(normalized.get(header) || ''))
  if (exact) return exact

  const loose = available.find((header) => {
    const key = normalized.get(header) || ''
    return looseMatchers.some((token) => key.includes(token))
  })
  return loose || null
}

export function suggestRequiredMappings(headers: string[]): ColumnMapping {
  const used = new Set<string>()
  const firstName = findHeader(
    headers,
    FIRST_NAME_ALIASES,
    ['first', 'given', 'fname', 'forename'],
    used,
  )
  if (firstName) used.add(firstName)

  const lastName = findHeader(
    headers,
    LAST_NAME_ALIASES,
    ['last', 'surname', 'family', 'lname'],
    used,
  )
  if (lastName) used.add(lastName)

  const email = findHeader(headers, EMAIL_ALIASES, ['email', 'mail'], used)
  if (email) used.add(email)

  const type = findHeader(
    headers,
    TYPE_ALIASES,
    ['type', 'role', 'category', 'persona'],
    used,
  )

  return { firstName, lastName, email, type }
}

function findExistingKey(existingKeys: string[], candidates: string[]): string | undefined {
  const byNormalized = new Map(
    existingKeys.map((key) => [normalizeHeader(key), key] as const),
  )

  for (const candidate of candidates) {
    const existing = byNormalized.get(normalizeHeader(candidate))
    if (existing) return existing
  }
  return undefined
}

export function suggestInfoKey(header: string, existingKeys: string[] = []): string {
  const normalized = normalizeHeader(header)

  const linkedinMatch = normalized.includes('linkedin')
  if (linkedinMatch) {
    return (
      findExistingKey(existingKeys, ['linkedin_url', 'linkedin', 'linkedinurl']) || 'linkedin_url'
    )
  }

  const instagramMatch =
    normalized === 'ig' || normalized.startsWith('ig_') || normalized.includes('instagram')
  if (instagramMatch) {
    return findExistingKey(existingKeys, ['ig_url', 'instagram_url', 'instagram']) || 'ig_url'
  }

  const facebookMatch = normalized.startsWith('fb') || normalized.includes('facebook')
  if (facebookMatch) {
    return findExistingKey(existingKeys, ['fb_url', 'facebook_url', 'facebook']) || 'fb_url'
  }

  const siteMatch =
    normalized.includes('website') ||
    normalized.includes('site') ||
    normalized === 'url' ||
    normalized === 'web'
  if (siteMatch) {
    return (
      findExistingKey(existingKeys, ['site_url', 'site', 'website_url', 'website']) || 'site_url'
    )
  }

  if (normalized.includes('dive') && normalized.includes('team')) {
    return findExistingKey(existingKeys, ['diveTeam', 'dive_team']) || 'diveTeam'
  }

  if (normalized.includes('dinner') && normalized.includes('table')) {
    return findExistingKey(existingKeys, ['dinnerTable', 'dinner_table']) || 'dinnerTable'
  }

  if (normalized.includes('company')) {
    return findExistingKey(existingKeys, ['company']) || 'company'
  }

  if (normalized.includes('title')) {
    return findExistingKey(existingKeys, ['title']) || 'title'
  }

  if (normalized.includes('bio')) {
    return findExistingKey(existingKeys, ['bio', 'proBio']) || 'bio'
  }

  if (normalized.includes('why') && normalized.includes('work')) {
    return findExistingKey(existingKeys, ['why_work', 'whywork']) || 'why_work'
  }

  const slug = slugifyHeader(header) || 'field'
  return findExistingKey(existingKeys, [slug]) || slug
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function buildPreviewRows(
  parsed: ParsedTable,
  mapping: ColumnMapping,
  extraColumns: ExtraColumnConfig[],
  nameSplit: NameSplitConfig = { enabled: false, nameHeader: null },
  typeConfig: TypeConfig = { sourceHeader: null, defaultType: 'attendee', valueMap: {} },
  existingEventEmails: Iterable<string> = [],
): PreviewRow[] {
  const duplicateGuard = new Set<string>()
  const defaultType = normalizeTypeValue(typeConfig.defaultType) || 'attendee'
  const existingEmailSet = new Set(
    Array.from(existingEventEmails, (email) => `${email}`.trim().toLowerCase()).filter(Boolean),
  )

  return parsed.rows.map((row, index) => {
    const errors: string[] = []

    let firstName = mapping.firstName ? (row[mapping.firstName] || '').trim() : ''
    let lastName = mapping.lastName ? (row[mapping.lastName] || '').trim() : ''
    if (nameSplit.enabled && nameSplit.nameHeader) {
      const fullName = (row[nameSplit.nameHeader] || '').trim()
      const firstSpace = fullName.indexOf(' ')
      if (firstSpace === -1) {
        firstName = fullName
        lastName = ''
      } else {
        firstName = fullName.slice(0, firstSpace).trim()
        lastName = fullName.slice(firstSpace + 1).trim()
      }
    }

    const emailRaw = mapping.email ? (row[mapping.email] || '').trim() : ''
    const email = emailRaw.toLowerCase()
    const alreadyAttending = Boolean(email && existingEmailSet.has(email))
    let type = defaultType
    if (typeConfig.sourceHeader) {
      const sourceValue = (row[typeConfig.sourceHeader] || '').trim()
      const normalizedSource = normalizeTypeValue(sourceValue)
      if (normalizedSource) {
        const mapped = typeConfig.valueMap[normalizedSource] || normalizedSource
        type = normalizeTypeValue(mapped) || defaultType
      }
    }

    if (!email) {
      errors.push('Missing email')
    } else if (!isValidEmail(email)) {
      errors.push('Invalid email')
    } else if (duplicateGuard.has(email)) {
      errors.push('Duplicate email in import file')
    } else {
      duplicateGuard.add(email)
    }

    const info: Record<string, string> = {}
    extraColumns.forEach((column) => {
      if (!column.include) return

      const key = column.key.trim()
      if (!key) {
        errors.push(`Missing key for ${column.sourceHeader}`)
        return
      }

      const value = (row[column.sourceHeader] || '').trim()
      if (value) {
        info[key] = value
      }
    })

    return {
      rowNumber: index + 2,
      firstName,
      lastName,
      email,
      type,
      alreadyAttending,
      info,
      valid: errors.length === 0,
      errors,
    }
  })
}

export function getTypeSourceValues(
  parsed: ParsedTable,
  sourceHeader: string | null,
): TypeSourceValue[] {
  if (!sourceHeader) return []

  const values = new Map<string, string>()
  parsed.rows.forEach((row) => {
    const sourceValue = (row[sourceHeader] || '').trim()
    const normalizedValue = normalizeTypeValue(sourceValue)
    if (!normalizedValue || values.has(normalizedValue)) return
    values.set(normalizedValue, sourceValue)
  })

  return Array.from(values.entries()).map(([normalizedValue, sourceValue]) => ({
    sourceValue,
    normalizedValue,
  }))
}
