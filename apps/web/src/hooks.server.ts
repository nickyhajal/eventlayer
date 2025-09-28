// hooks.server.ts
import { fail, redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { NODE_ENV } from "$env/static/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import type { RouteConfig } from "$lib/server/core/routeConfig";
import { getConfigForRoute } from "$lib/server/core/routeHelper";
import { loadUsers } from "$lib/server/loadUserData";
import { createTRPCHandle } from "trpc-sveltekit";

import { lucia } from "@matterloop/api";
import { redis } from "@matterloop/api/src/core/redis";
import { createContext } from "@matterloop/api/src/procedureWithContext";
import { router } from "@matterloop/api/src/root";
import {
  and,
  db,
  eq,
  Event,
  eventTable,
  eventUserConnectionTable,
  eventUserTable,
  mediaTable,
} from "@matterloop/db";
import { userTable } from "@matterloop/db/types";

// import { getConfigForRoute } from '$lib/server/core/routeHelper';
// import type { RouteConfig } from '$lib/server/core/routeConfig';
// import type { HandleServerError } from '@sveltejs/kit'
// import * as Sentry from '@sentry/sveltekit';
// import mailer from '$lib/server/mailer';

// Sentry.init({
// 	environment: NODE_ENV,
// 	dsn: 'https://d8dd3f742623485f9780e4cd6cca66b2@o419323.ingest.sentry.io/4505153344962560',
// 	// Performance Monitoring
// 	tracesSampleRate: 1.0 // Capture 100% of the transactions. Adjust this value in production as necessary.
// });
// export const handleError = Sentry.handleErrorWithSentry();

// async function fixUsers() {
// 	const infeb = await db.query.eventUserTable.findMany({
// 		where: and(
// 			gt(eventUserTable.createdAt, '2025-02-20 00:00:00'),
// 			lt(eventUserTable.createdAt, '2025-02-22 00:00:00')
// 		)
// 	})
// 	const infeb2 = await db.query.eventUserTable.findMany({
// 		where: and(
// 			eq(eventUserTable.eventId, '30c40f2f-05b9-480f-ba3b-1583f3d448e0'),
// 			inArray(eventUserTable.userId, infeb.map((i) => i.userId))
// 		)
// 	})
// 	const missing = []
// 	for (const u of infeb) {
// 		if (!infeb2.find((i) => i.userId === u.userId)) {
// 			missing.push(u)
// 		}
// 	}
// 	console.log('infeb', infeb.length)
// 	console.log('infeb2', infeb2.length)
// 	console.log('missing', missing.length)
// }
// fixUsers().then(() => console.log('done'))

const handleRouteRedirect = (defaultRedirect = "/", route: RouteConfig) => {
  const { failedAuthRedirect } = route;
  return redirect(303, failedAuthRedirect?.base || defaultRedirect);
};

export const handleCors: Handle = async ({ resolve, event }) => {
  // Apply CORS header for API routes
  const origin = event.request.headers.get("origin");
  if (
    event.url.pathname.startsWith("/trpc") ||
    event.url.pathname.startsWith("/signup") ||
    event.url.pathname.startsWith("/add-a") ||
    event.url.pathname.startsWith("/login")
  ) {
    // Required for CORS to work
    if (event.request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Headers": "content-type",
          "Access-Control-Allow-Credentials": true,
        },
      });
    }
  }

  const response = await resolve(event);
  response.headers.append("Access-Control-Allow-Origin", origin);
  response.headers.append("Access-Control-Allow-Headers", "content-type");
  response.headers.append("Access-Control-Allow-Credentials", true);
  return response;
};

const handleInit: Handle = async ({ event, resolve }) => {
  // NotificationSendController.BASE_URL = PUBLIC_BASE_URL;
  // NotificationSendController.PROTOCOL = PUBLIC_PROTOCOL;
  // setMailer(mailer);
  // if (event.url.hostname.startsWith('www.')) {
  // 	throw redirect(303, `${event.url.protocol}//${PUBLIC_BASE_URL}/${event.url.pathname}}`);
  // }
  // initRedis(REDIS_URL);
  // initPush();
  return resolve(event);
};
export const handleUserContext: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(lucia.sessionCookieName);
  if (!sessionId) {
    event.locals.me = undefined;
    event.locals.meId = undefined;
    return resolve(event);
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  }
  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    event.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  }
  event.locals.session = session;
  event.locals.user = user;
  if (user) {
    if (user?.id) {
      const fullUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, user?.id));
      event.locals.me = fullUser[0];
      event.locals.meId = fullUser[0].id;
      if (event.locals.event?.id) {
        const eventUserRow = await db.query.eventUserTable.findFirst({
          where: and(
            eq(eventUserTable.userId, user?.id),
            eq(eventUserTable.eventId, event.locals.event.id),
          ),
        });
        if (eventUserRow) {
          const { id, ...eventUser } = eventUserRow;
          event.locals.me = { ...fullUser[0], ...eventUser, eventUserId: id };
        }
        if (event.locals.me.mediaId) {
          const media = await db.query.mediaTable.findFirst({
            where: eq(mediaTable.id, fullUser[0].mediaId),
          });
          if (media) {
            event.locals.me.photo = media;
          }
        }
        event.locals.me.connectionsTo =
          await db.query.eventUserConnectionTable.findMany({
            where: and(
              eq(eventUserConnectionTable.eventId, event.locals.event.id),
              eq(eventUserConnectionTable.fromId, user?.id),
            ),
          });
        event.locals.me.connectionsFrom =
          await db.query.eventUserConnectionTable.findMany({
            where: and(
              eq(eventUserConnectionTable.eventId, event.locals.event.id),
              eq(eventUserConnectionTable.toId, eventUserRow?.id ?? ""),
            ),
          });
        event.locals.me.rsvps = await db.query.eventUserTable.findMany({
          where: and(
            eq(eventUserTable.mainId, event.locals.event.id),
            eq(eventUserTable.userId, user?.id),
          ),
          with: {
            event: {
              columns: {
                id: true,
                name: true,
                startsAt: true,
              },
            },
          },
        });
        delete event.locals.me.internalNotes;
      }
    }
  }
  return await resolve(event);
};
const handleEventContext: Handle = async ({ event, resolve }) => {
  let hostname =
    event.request.headers
      .get("host")
      ?.replace("http://", "")
      .replace("https://", "") || "";
  hostname = NODE_ENV === "development" ? hostname : hostname;
  event.locals.hostname = hostname;
  if (hostname.includes(PUBLIC_BASE_URL || "")) {
    const bits = hostname.split(".");
    if (bits.length >= 3) {
      const key = `event_subdomain:${bits[0]}`;
      let mainEvent = await redis.get<Event>(key);
      if (!mainEvent) {
        mainEvent =
          (await db.query.eventTable.findFirst({
            where: eq(eventTable.domainId, bits[0]),
          })) || null;
        redis.set(key, mainEvent);
      }
      if (event && mainEvent) event.locals.event = mainEvent;
    }
  } else {
    const mainEvent = await db.query.eventTable.findFirst({
      where: eq(eventTable.domainId, hostname),
    });
    if (event) event.locals.event = mainEvent;
  }
  return resolve(event);
};
const handleLogout: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === "/logout") {
    const sessionId = event.cookies.get(lucia.sessionCookieName);
    if (sessionId) {
      const { session, user } = await lucia.validateSession(sessionId);
      if (!session) throw fail(401);
      await lucia.invalidateSession(sessionId); // invalidate session
      event.cookies.delete(lucia.sessionCookieName, { path: "/" });
    }
    redirect(302, "/");
  }
  return resolve(event);
};
const handleRouteConfig: Handle = async ({ event, resolve }) => {
  const { me } = event.locals;
  if (!me) {
    if (
      !event.url.pathname.includes("/login") &&
      !event.url.pathname.includes("/trpc") &&
      !event.url.pathname.includes("/stripe") &&
      !event.url.pathname.includes("/add-a") &&
      !event.url.pathname.includes("/welcome") &&
      !event.url.pathname.includes("manifest")
    ) {
      return redirect(303, "/login");
    }
  }
  // if (me?.type !== 'staff') {
  // if (
  // 	!event.url.pathname.includes('/settings') &&
  // 	!event.url.pathname.includes('/login') &&
  // 	!event.url.pathname.includes('/welcome') &&
  // 	!event.url.pathname.includes('/manifest') &&
  // 	!event.url.pathname.includes('/trpc')
  // ) {
  // 	return redirect(303, '/welcome')
  // }
  // }
  const routeConfig = getConfigForRoute(event.url.pathname);
  const { auth } = routeConfig;
  if (auth === "logged-out" && me) {
    handleRouteRedirect("/", routeConfig);
  } else if (auth === "logged-in" && !me) {
    handleRouteRedirect("/login", routeConfig);
  } else if (
    auth === "event-staff" &&
    !(me?.isSuperAdmin || ["staff", "volunteer"].includes(me?.type))
  ) {
    handleRouteRedirect("/login", routeConfig);
  } else if (auth === "super-admin" && !me?.isSuperAdmin) {
    handleRouteRedirect("/login", routeConfig);
    // error(404, {
    // 	message: 'Page not found',
    // })
  }
  try {
    const rsp = await resolve(event);
    return rsp;
  } catch (e) {
    console.log("route config", e);
  }
  return resolve(event);
};
const handleTrpc = createTRPCHandle({
  router,
  createContext,
  onError: ({ type, path, error }) =>
    console.error(
      `Encountered error while trying to process ${type} @ ${path}:`,
      error,
    ),
});

export const handle: Handle = sequence(
  // Sentry.sentryHandle(),
  handleCors,
  handleInit,
  handleEventContext,
  handleUserContext,
  handleLogout,
  handleRouteConfig,
  handleTrpc,
);
