import { NextRequest, NextResponse } from "next/server";
import { readConfig, securityHeadersFor } from "./lib/config";

const config = readConfig();

const apiMatcher = new URLPattern({ pathname: "/api/:path*" });

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Security headers on every response (mirrors Express app.use(security(...))).
  const headers = securityHeadersFor(config, request);
  for (const [key, value] of headers) {
    response.headers.set(key, value);
  }

  // /api/* gets Cache-Control: no-store (mirrors Express).
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  // Host / origin guard for the API (mirrors security()'s production + local checks).
  if (apiMatcher.test(request.url)) {
    const isApi = true;
    const host = request.headers.get("host") ?? "";

    if (config.production) {
      const appHost = new URL(config.appUrl).host;
      const previewHost = config.previewUrl ? new URL(config.previewUrl).host : null;
      const allowedHosts = [appHost, ...(previewHost ? [previewHost] : [])];
      if (
        !config.appUrl.startsWith("https://") ||
        !allowedHosts.some((h) => h === host)
      ) {
        return NextResponse.json(
          { error: "Configure APP_URL with this deployment’s HTTPS origin." },
          { status: 503 },
        );
      }
      const origin = request.headers.get("origin");
      if (origin) {
        const originHost = new URL(origin).host;
        if (!allowedHosts.some((h) => h === originHost)) {
          return NextResponse.json(
            { error: "Cross-origin access denied." },
            { status: 403 },
          );
        }
      }
    } else {
      const hostAddr = host.split(":")[0];
      if (
        hostAddr &&
        !["127.0.0.1", "localhost"].includes(hostAddr) &&
        !request.nextUrl.hostname.endsWith(".localhost")
      ) {
        return NextResponse.json(
          { error: "Local access only." },
          { status: 403 },
        );
      }
    }

    // Same-origin client header required for mutating API calls (mirrors
    // security()'s x-apt-client check), except /api/echo which is a public probe.
    const method = request.method;
    if (
      !["GET", "HEAD", "OPTIONS"].includes(method) &&
      pathname !== "/api/echo"
    ) {
      if (request.headers.get("x-apt-client") !== "web") {
        return NextResponse.json(
          { error: "Same-origin client header required." },
          { status: 403 },
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on /api/* (the API the browser talks to) and on every request so the
     * CSP + security headers cover the frontend HTML too.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
