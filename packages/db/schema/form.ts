import { relations, sql, type InferModel } from 'drizzle-orm'
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { userTable } from './user'

const formElementStatus = pgEnum('form_element_status', ['active', 'inactive'])

// Tables
export const formTable = pgTable('form', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  type: text('type').default('report'),
  groupId: uuid('group_id').references(() => formGroupTable.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').references(() => eventTable.id, { onDelete: 'cascade' }),
  layout: text('layout').default('single'),
  autokey: text('autokey'),
  repeats: text('repeats').default('never'),
  name: text('name').notNull(),
  descr: text('descr'),
  ord: integer('ord'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})
export const formGroupTable = pgTable('form_group', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  type: text('type').default('model'),
  autokey: text('autokey'),
  name: text('name').notNull(),
  ord: integer('ord'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})
export const formElementTable = pgTable(
  'form_element',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    status: formElementStatus('status').default('active'),
    formId: uuid('form_id').references(() => formTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
    formElementId: uuid('form_element_id'),
    type: text('type').default('input'),
    content: text('content').default(''),
    className: text('class_name').default(''),
    ord: doublePrecision('ord').default(0).notNull(),
    page: integer('page').default(0).notNull(),
    step: integer('step').default(0).notNull(),
    group: integer('group').default(0).notNull(),
    label: text('label'),
    placeholder: text('placeholder'),
    hint: text('hint'),
    info: text('info'),
    options: text('options'),
    props: jsonb('props'),
    userProps: jsonb('user_props'),
    key: text('key'),
    userInfoKey: text('user_info_key'),
    userInfoPublic: boolean('user_info_public'),
    modelId: text('model_id'),
    // metricId: uuid('metric_id').references(() => metricTable.id, {
    // 	onDelete: 'cascade',
    // }),
    // metricType: text('metric_type'),
    // metricSpot: integer('metric_spot'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => {
    return {
      emailKey: index('key_key').on(table.key),
    }
  },
)
export const formSessionTable = pgTable('form_session', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  userId: uuid('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').references(() => eventTable.id, { onDelete: 'cascade' }),
  linkId: uuid('link_id'),
  formId: uuid('form_id').references(() => formTable.id, { onDelete: 'cascade' }),
  status: text('status'),
  lastNotification: text('last_notification'),
  submissionDate: date('submission_date'),
  lastNotified: date('last_notified'),
  onStepNumber: integer('on_step_number'),
  due: date('due'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})
export const formResponseTable = pgTable(
  'form_response',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').references(() => eventTable.id, { onDelete: 'cascade' }),
    formId: uuid('form_id').references(() => formTable.id, { onDelete: 'cascade' }),
    elementId: uuid('element_id').references(() => formElementTable.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => formSessionTable.id, { onDelete: 'cascade' }),
    type: text('type'),
    value: text('value'),
    html: text('html'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => {
    return {
      element_sessionKey: index('element_session_key').on(table.sessionId, table.elementId),
    }
  },
)

export const formResponseStatTable = pgTable('form_response_stat', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  eventId: uuid('company_id').references(() => eventTable.id, { onDelete: 'cascade' }),
  responseId: uuid('response_id').references(() => formResponseTable.id, { onDelete: 'cascade' }),
  elementId: uuid('element_id').references(() => formElementTable.id, { onDelete: 'cascade' }),
  count: integer('count'),
  change: doublePrecision('change'),
  total: doublePrecision('total'),
  avgTotal: doublePrecision('avgTotal'),
  changePercent: doublePrecision('changePercent'),
  history: jsonb('history'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

// Relations
export const formRelations = relations(formTable, ({ one, many }) => ({
  elements: many(formElementTable),
  sessions: many(formSessionTable),
  responses: many(formResponseTable),
  group: one(formGroupTable, { fields: [formTable.groupId], references: [formGroupTable.id] }),
  event: one(eventTable, {
    fields: [formTable.eventId],
    references: [eventTable.id],
  }),
}))
export const formGroupRelations = relations(formGroupTable, ({ many, one }) => ({
  forms: many(formTable),
}))
export const formElementRelations = relations(formElementTable, ({ many, one }) => ({
  form: one(formTable, { fields: [formElementTable.formId], references: [formTable.id] }),
  userId: one(userTable, { fields: [formElementTable.userId], references: [userTable.id] }),
  responses: many(formResponseTable),
}))
export const formSessionRelations = relations(formSessionTable, ({ one, many }) => ({
  user: one(userTable, { fields: [formSessionTable.userId], references: [userTable.id] }),
  form: one(formTable, { fields: [formSessionTable.formId], references: [formTable.id] }),
  event: one(eventTable, {
    fields: [formSessionTable.eventId],
    references: [eventTable.id],
  }),
  responses: many(formResponseTable),
}))
export const formResponseRelations = relations(formResponseTable, ({ one }) => ({
  form: one(formTable, { fields: [formResponseTable.formId], references: [formTable.id] }),
  user: one(userTable, { fields: [formResponseTable.userId], references: [userTable.id] }),
  session: one(formSessionTable, {
    fields: [formResponseTable.sessionId],
    references: [formSessionTable.id],
  }),
  element: one(formElementTable, {
    fields: [formResponseTable.elementId],
    references: [formElementTable.id],
  }),
  stats: one(formResponseStatTable, {
    fields: [formResponseTable.id],
    references: [formResponseStatTable.responseId],
  }),
  event: one(eventTable, {
    fields: [formResponseTable.eventId],
    references: [eventTable.id],
  }),
}))
export const formResponseStatRelations = relations(formResponseStatTable, ({ many, one }) => ({
  response: one(formResponseTable, {
    fields: [formResponseStatTable.responseId],
    references: [formResponseTable.id],
  }),
  element: one(formElementTable, {
    fields: [formResponseStatTable.elementId],
    references: [formElementTable.id],
  }),
  company: one(eventTable, {
    fields: [formResponseStatTable.eventId],
    references: [eventTable.id],
  }),
}))

// Types
export type Form = typeof formTable.$inferInsert
export type FormGroup = typeof formGroupTable.$inferSelect
export type FormElement = typeof formElementTable.$inferInsert
export type FormSession = InferModel<typeof formSessionTable>
export type FormResponse = typeof formResponseTable.$inferInsert
export type FormStat = typeof formResponseStatTable.$inferInsert
export type FormWithResponses = Form & { responses: FormResponse[] }
export type FormWithElements = Form & { elements?: FormElement[] | undefined | null }

// Schemas
export const formSchema = createInsertSchema(formTable, {
  name: (schema) => schema.name.default(''),
  descr: (schema) => schema.descr.default(''),
})
export const formGroupSchema = createInsertSchema(formGroupTable, {})
export const formElementSchema = createInsertSchema(formElementTable, {})
export type FormSchemaType = typeof formSchema
