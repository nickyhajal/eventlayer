import { error } from '@sveltejs/kit'

import {
  and,
  asc,
  db,
  eq,
  formElementTable,
  formResponseTable,
  formTable,
  mediaTable,
  userTable,
} from '@matterloop/db'

const NON_ANSWERABLE_TYPES = new Set(['title', 'markdown', 'button', 'space', 'avatar'])
const GROUPED_TYPES = new Set(['select', 'multi'])

type Photo = {
  id: string
  dir: string | null
  path: string | null
  ext: string | null
  version: number | null
} | null

type Answer = {
  id: string
  value: string | null
  html: string | null
  createdAt: string | null
  updatedAt: string | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    photo: Photo
  }
}

function parseOptions(
  options: string | null,
): Array<{ value: string; label: string }> {
  if (!options?.trim()) return []
  try {
    const parsed = JSON.parse(options) as Array<{ value?: string; label?: string }>
    return parsed
      .map((option) => {
        const value = (option.value || option.label || '').trim()
        const label = (option.label || option.value || '').trim()
        return value ? { value, label: label || value } : null
      })
      .filter(Boolean) as Array<{ value: string; label: string }>
  } catch {
    return []
  }
}

function parseMultiResponse(value: string | null): string[] {
  if (!value?.trim()) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed
        .flatMap((item) => (typeof item === 'string' ? [item] : []))
        .map((item) => item.trim())
        .filter(Boolean)
    }
  } catch {
    // Fall through to string parsing for legacy/non-JSON values.
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatPercent(count: number, denominator: number) {
  if (!denominator) return 0
  return Number(((count / denominator) * 100).toFixed(1))
}

export const load = async ({ locals, params }) => {
  if (!locals.event.id) {
    return error(404, 'Event not found')
  }

  if (!params.formId) {
    return error(404, 'No form id')
  }

  const form = await db.query.formTable.findFirst({
    where: and(eq(formTable.id, params.formId), eq(formTable.eventId, locals.event.id)),
    with: {
      elements: {
        orderBy: asc(formElementTable.ord),
      },
    },
  })

  if (!form) {
    return error(404, 'Form not found')
  }

  const responseRows = await db
    .select({
      id: formResponseTable.id,
      value: formResponseTable.value,
      html: formResponseTable.html,
      createdAt: formResponseTable.createdAt,
      updatedAt: formResponseTable.updatedAt,
      elementId: formResponseTable.elementId,
      elementType: formElementTable.type,
      elementLabel: formElementTable.label,
      elementContent: formElementTable.content,
      elementOptions: formElementTable.options,
      elementOrd: formElementTable.ord,
      userId: userTable.id,
      firstName: userTable.firstName,
      lastName: userTable.lastName,
      email: userTable.email,
      mediaId: mediaTable.id,
      mediaDir: mediaTable.dir,
      mediaPath: mediaTable.path,
      mediaExt: mediaTable.ext,
      mediaVersion: mediaTable.version,
    })
    .from(formResponseTable)
    .leftJoin(formElementTable, eq(formElementTable.id, formResponseTable.elementId))
    .leftJoin(userTable, eq(userTable.id, formResponseTable.userId))
    .leftJoin(mediaTable, eq(mediaTable.id, userTable.mediaId))
    .where(
      and(
        eq(formResponseTable.formId, params.formId),
        eq(formResponseTable.eventId, locals.event.id),
      ),
    )
    .orderBy(
      asc(formElementTable.ord),
      asc(userTable.firstName),
      asc(userTable.lastName),
      asc(formResponseTable.createdAt),
    )

  const answerableElements = form.elements
    .filter((element) => !NON_ANSWERABLE_TYPES.has(element.type || ''))
    .map((element) => ({
      id: element.id,
      type: element.type,
      label: element.label,
      content: element.content,
      options: element.options,
      ord: element.ord,
    }))

  const usersById = new Map<
    string,
    {
      id: string
      firstName: string | null
      lastName: string | null
      email: string | null
      photo: {
        id: string
        dir: string | null
        path: string | null
        ext: string | null
        version: number | null
      } | null
      responses: Array<{
        id: string
        value: string | null
        html: string | null
        createdAt: string | null
        updatedAt: string | null
        elementId: string | null
        elementLabel: string | null
        elementContent: string | null
        elementType: string | null
        elementOrd: number | null
      }>
    }
  >()

  const answersByElementId = new Map<string, Answer[]>()

  for (const row of responseRows) {
    if (!row.userId || !row.elementId) continue

    const photo = row.mediaId
      ? {
          id: row.mediaId,
          dir: row.mediaDir,
          path: row.mediaPath,
          ext: row.mediaExt,
          version: row.mediaVersion,
        }
      : null

    const response = {
      id: row.id,
      value: row.value,
      html: row.html,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      elementId: row.elementId,
      elementLabel: row.elementLabel,
      elementContent: row.elementContent,
      elementType: row.elementType,
      elementOrd: row.elementOrd,
    }

    const existingUser = usersById.get(row.userId)
    if (existingUser) {
      existingUser.responses.push(response)
    } else {
      usersById.set(row.userId, {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        photo,
        responses: [response],
      })
    }

    const answers = answersByElementId.get(row.elementId) ?? []
    answers.push({
      id: row.id,
      value: row.value,
      html: row.html,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        photo,
      },
    })
    answersByElementId.set(row.elementId, answers)
  }

  const collator = new Intl.Collator(undefined, { sensitivity: 'base' })
  const users = [...usersById.values()].sort((a, b) => {
    const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || ''
    const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email || ''
    return collator.compare(aName, bName)
  })

  const questions = answerableElements.map((element) => {
    const answers = answersByElementId.get(element.id) ?? []
    const displayMode = GROUPED_TYPES.has(element.type || '') ? 'grouped' : 'individual'
    const answerCount = answers.length

    if (displayMode === 'individual') {
      return {
        ...element,
        displayMode,
        answerCount,
        answers,
      }
    }

    const optionDefs = parseOptions(element.options)
    const optionLabelByValue = new Map(optionDefs.map((option) => [option.value, option.label]))
    const countsByValue = new Map<string, number>()
    const respondents = new Set<string>()

    for (const answer of answers) {
      respondents.add(answer.user.id)

      if (element.type === 'multi') {
        for (const selectedValue of parseMultiResponse(answer.value)) {
          countsByValue.set(selectedValue, (countsByValue.get(selectedValue) ?? 0) + 1)
        }
        continue
      }

      const rawValue = answer.value?.trim()
      if (!rawValue) continue
      countsByValue.set(rawValue, (countsByValue.get(rawValue) ?? 0) + 1)
    }

    const groupedAnswerValues = new Set<string>([
      ...optionDefs.map((option) => option.value),
      ...countsByValue.keys(),
    ])

    const groupedAnswers = [...groupedAnswerValues]
      .map((value) => {
        const count = countsByValue.get(value) ?? 0
        const percent = formatPercent(count, respondents.size)
        return {
          value,
          label: optionLabelByValue.get(value) ?? value,
          count,
          percent,
          barPercent: percent,
        }
      })
      .filter((group) => group.count > 0)
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return collator.compare(a.label, b.label)
      })

    return {
      ...element,
      displayMode,
      answerCount,
      answers,
      groupedAnswers,
    }
  })

  return {
    form: {
      id: form.id,
      name: form.name,
      type: form.type,
    },
    responseCount: users.length,
    users,
    questions,
  }
}
