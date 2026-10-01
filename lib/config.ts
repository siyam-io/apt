import type { NextRequest } from "next/server";

export type Config = Readonly<{
  production: boolean;
  appUrl: string;
  allowPrivate: boolean;
  previewUrl: string;
}>;

export function readConfig(env = process.env): Config {
  const production =
    env.VERCEL === "1" || env.NODE_ENV === "production";
  let appUrl = "";
  try {
    appUrl = env.APP_URL ? new URL(env.APP_URL).origin : "";
  } catch {
    /* Report setup errors through API. */
  }
  return {
    production,
    appUrl,
    allowPrivate: !production,
    previewUrl: env.VERCEL_URL
      ? `https://${env.VERCEL_URL}`
      : "",
  };
}

export function sessionCookieName(config: Config): string {
  return config.production ? "__Host-apt-session" : "apt-session";
}

function securityHeaders() {
  return new Headers({
    "Content-Security-Policy":
      "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  });
}

function resolvedOrigin(config: Config, request: NextRequest): string[] {
  if (config.production) {
    const origins = [config.appUrl, config.previewUrl].filter(Boolean);
    if (
      !config.appUrl.startsWith("https://") ||
      !origins.some(
        (origin) => new URL(origin).host === request.headers.get("host")?.split(":")[0],
      )
    )
      throw new Response(
        JSON.stringify({ error: "Configure APP_URL with this deployment’s HTTPS origin." }),
        {
          status: 503,
          headers: { "content-type": "application/json" },
        },
      );
    return origins;
  }
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (
    !["127.0.0.1", "localhost"].includes(host) &&
    !request.nextUrl.hostname.endsWith(".localhost")
  )
    throw new Response(
      JSON.stringify({ error: "Local access only." }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  return [`http://${host}`];
}

export function securityHeadersFor(
  config: Config,
  request: NextRequest,
): Headers {
  const headers = securityHeaders();
  const origin = request.headers.get("origin");
  if (origin === null) return headers;
  const allowed = resolvedOrigin(config, request);
  if (!allowed.includes(origin))
    throw new Response(
      JSON.stringify({ error: "Cross-origin access denied." }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  return headers;
}

export function isSameOriginClientRequest(
  config: Config,
  request: NextRequest,
): boolean {
  const method = request.method;
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/api/")) return true;
  if (path === "/api/echo") return true;
  return request.headers.get("x-apt-client") === "web";
}


