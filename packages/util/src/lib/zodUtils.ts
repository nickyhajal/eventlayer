import { z } from 'zod'

export function makeOptionalPropsNullable<Schema extends z.AnyZodObject>(schema: Schema) {
  const entries = Object.entries(schema.shape) as [keyof Schema['shape'], z.ZodTypeAny][]
  const newProps = entries.reduce(
    (acc, [key, value]) => {
      acc[key] = value instanceof z.ZodOptional ? value.unwrap().nullable() : value
      return acc
    },
    {} as {
      [key in keyof Schema['shape']]: Schema['shape'][key] extends z.ZodOptional<infer T>
        ? z.ZodNullable<T>
        : Schema['shape'][key]
    },
  )
  return z.object(newProps)
}
export function makeNullablePropsOptional<Schema extends z.AnyZodObject>(schema: Schema) {
  const entries = Object.entries(schema.shape) as [keyof Schema['shape'], z.ZodTypeAny][]
  const newProps = entries.reduce(
    (acc, [key, value]) => {
      acc[key] = value instanceof z.ZodNullable ? value.unwrap().optional() : value
      return acc
    },
    {} as {
      [key in keyof Schema['shape']]: Schema['shape'][key] extends z.ZodNullable<infer T>
        ? z.ZodOptional<T>
        : Schema['shape'][key]
    },
  )
  return z.object(newProps)
}
export function makeCreateInput<Schema extends z.ZodRawShape>(schema: z.ZodObject<Schema>) {
  return schema.partial({
    userId: true,
    communityId: true,
    id: true,
  })
}
export function makeUpdateInput<Schema extends z.ZodRawShape>(schema: z.ZodObject<Schema>) {
  return schema.required({ id: true })
}
export function makeQueryInput<Schema extends z.ZodRawShape>(
  schema: z.ZodObject<Schema>,
  ids: Array<keyof z.ZodObject<Schema>['shape']>,
) {
  const toPick = ids.reduce(
    (out, curr) => ({ [curr]: true, ...out }),
    {} as { [key in keyof z.ZodObject<Schema>['shape']]: true },
  )
  return schema.pick(toPick).partial().extend({
    take: z.number().optional(),
    skip: z.number().optional(),
  })
}
