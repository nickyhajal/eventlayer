// routes/login/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit";
import QRCode from "qrcode";
import { message, setError, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

import { EventFns, VenueFns } from "@matterloop/api";
import {
  and,
  asc,
  db,
  desc,
  eq,
  eventTicketTable,
  eventUserFieldTable,
  loginLinkTable,
  or,
} from "@matterloop/db";
import { ActiveLoginLink } from "@matterloop/api/src/models/ActiveLoginLink";

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const load = async ({ locals, params, url }) => {
  if (!params.userId) {
    return error(404, "No user id");
  }
  const eventFns = EventFns({ eventId: locals.event.id });
  const user = await eventFns.getUser(params.userId);
  if (!user) {
    return error(404, "User not found");
  }

  const ticket = await db.query.eventTicketTable.findFirst({
    where: and(
      eq(eventTicketTable.assignedTo, user.userId),
      eq(eventTicketTable.eventId, locals.event.id),
    ),
    with: {
      user: true,
    },
  });

  let login_link = null;
  const login_links = await db.query.loginLinkTable.findMany({
    where: eq(loginLinkTable.userId, user.userId),
    orderBy: desc(loginLinkTable.createdAt),
  });
  if (login_links.length) {
    login_link = ActiveLoginLink.getUrl({
      loginLink: login_links[0],
      event: locals.event,
    });
  }

  const qrcode = await QRCode.toDataURL(
    `${url.protocol}://${url.host}/user/${user.id}`,
    {
      width: 320,
    },
  );

  // Load custom fields applicable to this user
  const allCustomFields = await db.query.eventUserFieldTable.findMany({
    where: eq(eventUserFieldTable.eventId, locals.event.id),
    orderBy: [asc(eventUserFieldTable.ord)],
  });

  // Filter fields by scope
  const customFields = allCustomFields.filter((field) => {
    if (field.scope === 'all') return true;
    if (field.scope === 'user' && field.scopeValue === user.userId) return true;
    if (field.scope === 'type' && field.scopeValue === user.type) return true;
    return false;
  });

  return { user, qrcode, ticket, login_link: login_link?.url, customFields };
};
