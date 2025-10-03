// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { db, eq } from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { dayjs } from '@matterloop/util'
import { today } from '@matterloop/util/src/lib/dayjs'

// import { auth } from '../core/auth'
import { procedureWithContext, type TrpcContext } from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
const UserInput = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string(),
})
const HasID = z.object({ id: z.string() })
export const meRouter = t.router({
  get: procedureWithContext
    .input(
      z
        .object({
          day: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx }) => {
      if (!ctx.meId) {
        return null
      }
      const user = ctx.me
      if (!user || !ctx.me) {
        return null
      }
      return db.query.userTable.findFirst({
        where: eq(userTable.id, ctx.meId),
        with: {},
      })
    }),
  add: procedureWithContext
    .input(UserInput)
    .mutation(async ({ input, ctx }): Promise<User | null> => {
      const { email, password } = input
      try {
        const existing = await db.query.userTable.findFirst({ where: eq(userTable.email, email) })
        if (existing) {
          throw error(401, 'An account already exists with this email')
        }
        const user = await auth.createUser({
          userId: crypto.randomUUID(),
          key: {
            providerId: 'email',
            providerUserId: email,
            password,
          },
          attributes: {
            email,
          },
        })
        const session = await auth.createSession({ userId: user.userId, attributes: {} })
        const sessionCookie = auth.createSessionCookie(session)
        ctx.cookies.set('sessiontest', session.sessionId)
        // ctx.auth.setSession(session)
        return user
      } catch (e) {
        // username taken
        console.error(e)
        throw error(401, 'There was an error')
      }
    }),
  // update: procedureWithContext
  //   .input(UserInput.partial().merge(HasID))
  //   .mutation(async ({ ctx, input }): Promise<user | null> => {
  //     let { id, ...data } = input;
  //     id = input.id || ctx?.me?.community?.id || "";
  //     const entity = await prisma.user.findUnique({ where: { id } });
  //     verifyHasPermission({ me: ctx.me, key: "id", entity });
  //     return await prisma.user.update({
  //       where: { id },
  //       data,
  //     });
  //   }),
  // getSession: procedureWithContext.query(
  //   async ({ ctx }): Promise<string | void> => {
  //     const session = ctx.req.cookies.get("session");
  //     if (session) {
  //       const signed = signature.sign(session, SESSION_SECRET || "");
  //       return signed;
  //     }
  //   }
  // ),
  // login: procedureWithContext
  //   .input(
  //     z.object({
  //       email: z.string().email(),
  //       password: z.string(),
  //     })
  //   )
  //   .mutation(
  //     async ({ input: { email, password }, ctx }): Promise<LoginResponse> => {
  //       const user = await prisma.user.findUnique({ where: { email } });
  //       if (!user) {
  //         throw new Error("User does not exist");
  //       }
  //       const isAuthenticated = user.checkPassword(password);
  //       if (!isAuthenticated) {
  //         throw new Error("Incorrect email/password");
  //       }
  //       await sessionManager.createNewSession(ctx.req.cookies, {
  //         userId: user.id,
  //       });
  //       const sess = await sessionManager.getSession(ctx.req.cookies);
  //       return { user };
  //     }
  //   ),
  // create: procedureWithContext
  //   .input(UserInput)
  //   .mutation(
  //     async ({
  //       input: { firstName, lastName, email, password },
  //       ctx,
  //     }): Promise<LoginResponse> => {
  //       let user = await prisma.user.findUnique({ where: { email } });
  //       if (user) {
  //         throw new Error("User already exists");
  //       }
  //       user = await prisma.user.create({
  //         data: {
  //           firstName,
  //           lastName,
  //           email,
  //         },
  //       });
  //       await user.setPassword(password);
  //       sessionManager.createNewSession(ctx.req.cookies, {
  //         userId: user.id,
  //       });
  //       const sess = await sessionManager.getSession(ctx.req.cookies);
  //       return {
  //         user,
  //       };
  //     }
  //   ),
})
