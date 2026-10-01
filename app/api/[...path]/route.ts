import type { NextRequest } from "next/server";

/**
 * The Express API stays the source of truth. Next.js owns the origin the browser
 * talks to, so every /api/* call is forwarded server-side. Requests are relayed
 * without the browser's `origin`/`host`, because the Express security layer only
 * accepts same-origin mutations and would reject the Next.js dev origin.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_URL = (process.env.API_URL || "http://127.0.0.1:3001").replace(
  /\/+$/,
  "",
);

const FORWARDED_HEADERS = new Set([
  "accept",
  "accept-language",
  "content-type",
  "cookie",
  "x-apt-client",
]);

async function forward(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const target = new URL(`${API_URL}/api/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (FORWARDED_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  }
  headers.set("x-apt-client", "web");

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json(
      {
        error:
          "API server unreachable. Start it with `npm run dev:api` and check API_URL.",
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers({ "cache-control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export {
  forward as DELETE,
  forward as GET,
  forward as HEAD,
  forward as OPTIONS,
  forward as PATCH,
  forward as POST,
  forward as PUT,
};
