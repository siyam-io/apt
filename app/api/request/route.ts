import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { rateLimit, authenticate, ipKey } from "@/lib/auth";
import { readConfig } from "@/lib/config";
import { publicDispatcher } from "@/lib/network";
import { fetch as undiciFetch } from "undici";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const config = readConfig();
  const pool = getPool();

  // Support guest mode + logged-in mode
  let userId: string | null = null;
  if (pool) {
    try {
      const auth = await authenticate(pool, config, request);
      if ("user" in auth && auth.user) {
        userId = auth.user.id;
      }
    } catch {
      // Continue as guest
    }

    try {
      if (userId) {
        await rateLimit(pool, `proxy:${userId}`, 60, 60);
      } else {
        await rateLimit(pool, `proxy-guest:${ipKey(config, request)}`, 30, 60);
      }
    } catch (err: any) {
      if (err?.status === 429) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
    }
  }

  let bodyData: any;
  try {
    bodyData = await request.json();
  } catch {
    return NextResponse.json({ error: "Send application/json." }, { status: 415 });
  }

  const {
    url,
    method = "GET",
    headers = {},
    body = "",
    timeout = 30000,
  } = bodyData ?? {};

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Enter a valid HTTP(S) URL." },
      { status: 400 },
    );
  }

  if (
    !["http:", "https:"].includes(target.protocol) ||
    target.username ||
    target.password
  ) {
    return NextResponse.json(
      { error: "Use HTTP(S) URLs without embedded credentials." },
      { status: 400 },
    );
  }

  const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
  if (
    !allowedMethods.includes(method) ||
    typeof body !== "string" ||
    !Number.isInteger(timeout) ||
    timeout < 1 ||
    timeout > 45000 ||
    !headers ||
    typeof headers !== "object" ||
    Array.isArray(headers)
  ) {
    return NextResponse.json(
      { error: "Invalid method, headers, body or timeout (1–45000 ms)." },
      { status: 400 },
    );
  }

  const outbound = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (
      typeof value !== "string" ||
      /^(host|content-length|connection|transfer-encoding|upgrade|proxy-.*|x-forwarded-.*|forwarded)$/i.test(
        key,
      )
    ) {
      return NextResponse.json(
        { error: `Unsupported header: ${key}` },
        { status: 400 },
      );
    }
    try {
      outbound.set(key, value);
    } catch {
      return NextResponse.json(
        { error: `Invalid header: ${key}` },
        { status: 400 },
      );
    }
  }

  const controller = new AbortController();
  let timedOut = false;
  let dispatcher: any = undefined;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  try {
    const start = performance.now();

    if (!config.allowPrivate) {
      dispatcher = await publicDispatcher(target, {
        signal: controller.signal,
      });
    }

    const upstream = await undiciFetch(target, {
      method,
      headers: outbound,
      body: ["GET", "HEAD"].includes(method) ? undefined : body || undefined,
      signal: controller.signal,
      redirect: "manual",
      ...(dispatcher ? { dispatcher } : {}),
    });

    const chunks: Uint8Array[] = [];
    let size = 0;
    if (upstream.body) {
      for await (const chunk of upstream.body as any) {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) {
          controller.abort();
          return NextResponse.json(
            { error: "Response exceeds 2 MB limit." },
            { status: 413 },
          );
        }
        chunks.push(chunk);
      }
    }

    const result = {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: Object.fromEntries(upstream.headers),
      body: Buffer.concat(chunks).toString("utf8"),
      size,
      duration: Math.round(performance.now() - start),
    };

    if (Buffer.byteLength(JSON.stringify(result)) > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Encoded response exceeds 4 MB limit." },
        { status: 413 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (timedOut) {
      return NextResponse.json({ error: "Request timed out." }, { status: 504 });
    }
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          "Connection failed. Check URL, availability and TLS certificate.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
    if (dispatcher) {
      await dispatcher.close().catch(() => {});
    }
  }
}
