import { describe, expect, it } from 'vitest'

import {
  buildPreviewRows,
  detectDelimiter,
  getTypeSourceValues,
  normalizeHeader,
  normalizeTypeValue,
  parseTabularText,
  suggestInfoKey,
  suggestRequiredMappings,
} from './importUtils'

describe('importUtils', () => {
  it('detects tab delimiter first', () => {
    const input = 'First\tLast\tEmail\nA\tB\ta@example.com'
    expect(detectDelimiter(input)).toBe('\t')
  })

  it('detects semicolon over comma', () => {
    const input = 'First;Last;Email\nA;B;a@example.com'
    expect(detectDelimiter(input)).toBe(';')
  })

  it('defaults delimiter to comma', () => {
    const input = 'First,Last,Email\nA,B,a@example.com'
    expect(detectDelimiter(input)).toBe(',')
  })

  it('parses quoted csv values', () => {
    const input = 'First,Company,Email\nAlice,"Acme, Inc.",alice@example.com'
    const parsed = parseTabularText(input)
    expect(parsed.headers).toEqual(['First', 'Company', 'Email'])
    expect(parsed.rows[0].Company).toBe('Acme, Inc.')
  })

  it('normalizes headers to slug style', () => {
    expect(normalizeHeader(' Email Address ')).toBe('email_address')
  })

  it('suggests required mappings from aliases', () => {
    const headers = ['First Name', 'Surname', 'Email Address', 'Role', 'Company']
    const suggested = suggestRequiredMappings(headers)
    expect(suggested.firstName).toBe('First Name')
    expect(suggested.lastName).toBe('Surname')
    expect(suggested.email).toBe('Email Address')
    expect(suggested.type).toBe('Role')
  })

  it('prefers existing key patterns for info key suggestions', () => {
    const key = suggestInfoKey('Website URL', ['site_url', 'linkedin_url'])
    expect(key).toBe('site_url')
  })

  it('marks duplicate emails in preview as invalid', () => {
    const parsed = parseTabularText(
      'First Name,Last Name,Email,Company\nA,One,a@example.com,Acme\nB,Two,a@example.com,Beta',
    )
    const preview = buildPreviewRows(
      parsed,
      {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        type: null,
      },
      [
        {
          sourceHeader: 'Company',
          include: true,
          key: 'company',
          suggestedKey: 'company',
        },
      ],
    )

    expect(preview[0].valid).toBe(true)
    expect(preview[1].valid).toBe(false)
    expect(preview[1].errors).toContain('Duplicate email in import file')
  })

  it('splits name by first space when enabled', () => {
    const parsed = parseTabularText(
      'Name,Email\nNick Smith,nick@example.com\nJohn Van Der Hoot,john@example.com',
    )
    const preview = buildPreviewRows(
      parsed,
      {
        firstName: null,
        lastName: null,
        email: 'Email',
        type: null,
      },
      [],
      { enabled: true, nameHeader: 'Name' },
    )

    expect(preview[0].firstName).toBe('Nick')
    expect(preview[0].lastName).toBe('Smith')
    expect(preview[1].firstName).toBe('John')
    expect(preview[1].lastName).toBe('Van Der Hoot')
  })

  it('normalizes type values to lower slug format', () => {
    expect(normalizeTypeValue(' Attendee ')).toBe('attendee')
    expect(normalizeTypeValue('Vendor/Sales')).toBe('vendor_sales')
  })

  it('extracts unique normalized type values from source header', () => {
    const parsed = parseTabularText(
      'Type,Email\nAttendee,a@example.com\nVendor/Sales,b@example.com\nATTENDEE,c@example.com',
    )
    const values = getTypeSourceValues(parsed, 'Type')

    expect(values).toEqual([
      { sourceValue: 'Attendee', normalizedValue: 'attendee' },
      { sourceValue: 'Vendor/Sales', normalizedValue: 'vendor_sales' },
    ])
  })

  it('applies type mapping overrides with attendee default fallback', () => {
    const parsed = parseTabularText(
      'Type,Email\nAttendee,a@example.com\nVendor/Sales,b@example.com\n,c@example.com',
    )
    const preview = buildPreviewRows(
      parsed,
      {
        firstName: null,
        lastName: null,
        email: 'Email',
        type: 'Type',
      },
      [],
      { enabled: false, nameHeader: null },
      {
        sourceHeader: 'Type',
        defaultType: 'attendee',
        valueMap: {
          attendee: 'attendee',
          vendor_sales: 'vendor',
        },
      },
    )

    expect(preview[0].type).toBe('attendee')
    expect(preview[1].type).toBe('vendor')
    expect(preview[2].type).toBe('attendee')
  })

  it('flags rows that already exist in current event by email', () => {
    const parsed = parseTabularText(
      'First Name,Last Name,Email\nA,One,a@example.com\nB,Two,b@example.com',
    )
    const preview = buildPreviewRows(
      parsed,
      {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        type: null,
      },
      [],
      { enabled: false, nameHeader: null },
      { sourceHeader: null, defaultType: 'attendee', valueMap: {} },
      ['a@example.com'],
    )

    expect(preview[0].alreadyAttending).toBe(true)
    expect(preview[0].valid).toBe(true)
    expect(preview[1].alreadyAttending).toBe(false)
  })
})
