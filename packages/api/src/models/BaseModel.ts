import { db, eq, InferSelectModel } from '@matterloop/db'

export abstract class BaseModel<T extends InferSelectModel<any>> {
  protected table: T

  constructor(protected data: Partial<T>) {}

  static async get<T extends BaseModel<any>>(
    this: new (data: any) => T,
    id: any,
  ): Promise<T | null> {
    const table = this.prototype.table
    const result = await db
      .select()
      .from(table)
      .where(eq(table.id as any, id))
      .execute()
    if (result.length === 0) {
      return null
    }
    return new this(result[0])
  }

  async save(): Promise<void> {
    if ((this.data as any).id) {
      await db
        .update(this.table)
        .set(this.data)
        .where(eq(this.table.id as any, (this.data as any).id))
        .execute()
    } else {
      await db.insert(this.table).values(this.data).execute()
    }
  }

  // Add more common methods as needed
}
