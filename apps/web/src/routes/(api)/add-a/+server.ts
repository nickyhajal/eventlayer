import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getStripeDataFromSession } from "$lib/stripe";
import { z } from "zod";
import {
  and,
  db,
  eq,
  eventTicketTable,
  eventUserConnectionTable,
  eventUserInfoTable,
  eventUserTable,
  formResponseTable,
  formSessionTable,
  mediaTable,
  isNull,
  userTable,
} from "@matterloop/db";
import dayjs from "@matterloop/util/src/lib/dayjs";
import { redis } from "@matterloop/api/src/core/redis";

const schema = z.object({
  cid: z.string(),
  attendees: z.array(
    z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  ),
});
const fieldMap: Record<string, string> = {
  "64021b5d-2b4d-4fb2-bdcd-6bc6aa81f5f8":
    "aa1d806d-26ef-4c05-b8b9-a4c36861c9fc",
  "2ff7bd05-56da-4ba0-a9c0-71a9ad320f07":
    "84c0afc4-67ea-4494-b824-96a259f48232",
  "cf1b5075-2095-42c1-a5fd-6c6755d6f6da":
    "b5c57414-e5c7-4502-a59f-3b1f3f1e9766",
  "dcf86b20-2632-4364-a1bf-c60043ee8799":
    "fdeda3e2-8771-45e6-b671-3dc35231dd7a",
  "c3938c19-a516-47b7-8a35-d0e0c99cbac8":
    "20431479-7675-41a8-a75a-ffb46ca10f11",
  "0240d99c-cf3a-486e-bb73-d14ee5f92eaa":
    "14a0295e-f1cb-4000-b434-1fec77cc9b1b",
  "f154d92f-e51f-4aef-bde0-acff359479c6":
    "306bbab1-efdc-4f0b-8614-014e30f81bbc",
  "6eb6a196-b9f1-4d0d-be29-a152049e0dc6":
    "2692a0ee-ba28-4ea1-9aca-232493dac808",
  "f56874c4-905b-4a77-8f7c-248c0e39beb5":
    "d5e0ce40-824b-4f6f-85ca-501d2037f4e2",
  "20360b0f-f1da-4234-9dea-0f09c2cc4e45":
    "d443c3bf-9052-40d4-90cc-5e54c0b4bec4",
  "6fed3751-782c-4b70-add0-b698595a3598":
    "c52fddd9-eedb-4975-802e-36bf6db90e5c",
  "2bfebf1b-6e5f-4239-bc68-01e11bb088fb":
    "7cf7738a-5afd-41e2-88cf-f869d61c46b9",
  "e6fc0a2f-9ae0-468e-a3e0-489a0a292ea4":
    "7c7fff51-e951-409d-9c37-45174d8a19dd",
  "7861100c-2d8e-4b34-a4fc-382419491388":
    "99323839-cd91-44ce-86fc-e539c949a16f",
  "50940010-dc37-445f-bfc4-d727ca4fa7af":
    "b6a42af8-0d3c-40dc-9efe-95ef12caff0e",
};

const getNameParts = (name: string) => {
  const firstSpace = name.indexOf(" ");
  const firstName = name.substring(0, firstSpace);
  const lastName = name.substring(firstSpace + 1);
  return { firstName, lastName };
};

const getOrCreateUser = async (email: string, name: string) => {
  let user = await db.query.userTable.findFirst({
    where: eq(userTable.email, email),
  });
  const { firstName, lastName } = getNameParts(name);
  if (user) {
    if (!user.firstName) {
      await db
        .update(userTable)
        .set({ firstName, lastName })
        .where(eq(userTable.id, user.id));
    }
  }
  if (!user) {
    const inserted = await db
      .insert(userTable)
      .values({
        email,
        firstName,
        lastName,
      })
      .returning();
    if (inserted) {
      user = inserted[0];
    }
  }
  if (user) {
    return user;
  }
};

const getOrCreateEventUser = async (userId: string, type: string) => {
  let eventUser = await db.query.eventUserTable.findFirst({
    where: and(
      eq(eventUserTable.userId, userId),
      eq(eventUserTable.eventId, "d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4"),
    ),
  });
  if (eventUser) {
    return eventUser;
  }
  const previousYearEventUser = await db.query.eventUserTable.findFirst({
    where: and(
      eq(eventUserTable.userId, userId),
      eq(eventUserTable.eventId, "30c40f2f-05b9-480f-ba3b-1583f3d448e0"),
    ),
  });

  const inserted = await db
    .insert(eventUserTable)
    .values({
      userId,
      type,
      eventId: "d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4",
      status: "active",
      onboardStatus: "not-sent",
      proBio: previousYearEventUser?.proBio,
      bio: previousYearEventUser?.bio,
      url: previousYearEventUser?.url,
      company: previousYearEventUser?.company,
      title: previousYearEventUser?.title,
      internalNotes: previousYearEventUser?.internalNotes,
      onboardFormId: "c2446d19-52fb-4dcd-a7da-3fd373189c6f",
    })
    .returning();
  if (inserted) {
    eventUser = inserted[0];
  }
  if (previousYearEventUser?.userId && previousYearEventUser?.eventId) {
    const previousInfo = await db.query.eventUserInfoTable.findMany({
      where: and(
        eq(eventUserInfoTable.userId, previousYearEventUser.userId),
        eq(eventUserInfoTable.eventId, previousYearEventUser.eventId),
      ),
    });
    if (previousInfo?.length) {
      previousInfo.forEach((row, i) => {
        const { id, createdAt, updatedAt, ...info } = row;
        previousInfo[i] = {
          ...info,
          userId,
          eventId: "d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4",
        };
      });
      await db.insert(eventUserInfoTable).values(previousInfo);
    }
    const connections = await db.query.eventUserConnectionTable.findMany({
      where: and(
        eq(eventUserConnectionTable.fromId, previousYearEventUser.userId),
        eq(eventUserConnectionTable.eventId, previousYearEventUser.eventId),
      ),
    });
    if (connections?.length) {
      connections.forEach((row, i) => {
        const { id, createdAt, updatedAt, ...info } = row;
        connections[i] = {
          ...info,
          fromId: userId,
          eventId: "d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4",
        };
      });
      await db.insert(eventUserConnectionTable).values(connections);
    }
    const responses = await db.query.formResponseTable.findMany({
      where: and(
        eq(formResponseTable.userId, previousYearEventUser.userId),
        eq(formResponseTable.formId, "1c98ccdf-76af-48b7-985b-a5e98dbd8b17"),
      ),
    });
    if (responses?.length) {
      const sessionRes = await db
        .insert(formSessionTable)
        .values({
          userId: userId,
          eventId: "d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4",
          formId: "c2446d19-52fb-4dcd-a7da-3fd373189c6f",
          status: "submitted",
          submissionDate: dayjs().format("YYYY-MM-DD"),
        })
        .returning();
      if (sessionRes?.[0]) {
        const session = sessionRes[0];
        responses.forEach((row, i) => {
          const { id, createdAt, updatedAt, ...info } = row;
          if (fieldMap[info?.elementId ?? ""]) {
            responses[i] = {
              ...info,
              userId: userId,
              eventId: "d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4",
              formId: "c2446d19-52fb-4dcd-a7da-3fd373189c6f",
              elementId: fieldMap[info.elementId ?? ""],
              sessionId: session.id,
              value: info.value,
            };
          }
        });
        await db.insert(formResponseTable).values(responses);
      }
      await db
        .update(mediaTable)
        .set({
          eventId: "d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4",
        })
        .where(
          and(
            eq(mediaTable.userId, userId),
            eq(mediaTable.eventId, "30c40f2f-05b9-480f-ba3b-1583f3d448e0"),
          ),
        );
    }
  }
  await redis.del(`event_users:d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4`);
  await redis.del(`event_usersWithInfo:d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4`);
  await redis.del(`event_heavy:d7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4`);
  return eventUser;
};

async function addToKit(email: string, name: string) {
  const url = "https://api.kit.com/v4/lists/8602469/subscribers";
  try {
    console.log("add to kit - attendees", email, name);
    const rsp = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        email_address: email,
        name: name,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer kit_84309a9eff8218e4b7aebae051c8b09c`,
      },
    });
    console.log("add to kit - attendees", rsp.status, rsp.statusText);
    const data = await rsp.text();
    console.log("add to kit - attendees", data);
  } catch (e) {
    console.error("Failed to add to Kit", e);
}

export const POST: RequestHandler = async ({ url, request }) => {
  // Extract checkout ID from query parameters
  const body = await request.json();
  try {
    const { cid, attendees } = schema.parse(body);
    const stripe = await getStripeDataFromSession(cid);
    const quantity = stripe.line_items[0].quantity ?? 0;
    if (quantity < attendees.length) {
      throw error(400, "Quantity does not match attendees length");
    }
    const tickets = await db.query.eventTicketTable.findMany({
      where: and(
        eq(eventTicketTable.type, cid),
        isNull(eventTicketTable.assignedTo),
      ),
    });
    if (tickets.length < attendees.length) {
      throw error(400, "Not enough tickets to add attendees");
    }
    await Promise.all(
      Array(attendees.length)
        .fill(0)
        .map(async (_, i) => {
          const attendee = attendees[i];
          const user = await getOrCreateUser(attendee.email, attendee.name);
          if (!user) {
            throw error(400, "Could not create user");
          }
          const eventUser = await getOrCreateEventUser(user.id, "attendee");
          if (!eventUser) {
            throw error(400, "Could not create event user");
          }
          const kitRsp = await addToKit(attendee.email, attendee.name);

          return db
            .update(eventTicketTable)
            .set({
              assignedTo: user.id,
              assignedOn: dayjs().toISOString(),
              status: "assigned",
            })
            .where(eq(eventTicketTable.id, tickets[i].id));
        }),
    );

    return json(stripe);
  } catch (e) {
    console.error(e);
    throw error(400, e?.body?.message ?? "Invalid attendee data");
  }
};
