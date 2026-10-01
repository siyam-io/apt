import { publicDispatcher } from "./network.js";
import { fetch } from "undici";
import { rateLimit } from "./auth.js";

export function proxyHandler(db, config, dispatcherFactory = publicDispatcher) {
  return async (req, res) => {
    if (!req.is("application/json"))
      return res.status(415).json({ error: "Send application/json." });
    await rateLimit(db, `proxy:${req.user.id}`, 60, 60);
    const controller = new AbortController();
    let timer;
    let dispatcher;
    let timedOut = false;
    const cancel = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on("close", cancel);
    try {
      const {
        url,
        method = "GET",
        headers = {},
        body = "",
        timeout = 30000,
      } = req.body ?? {};
      let target;
      try {
        target = new URL(url);
      } catch {
        throw Object.assign(new Error("Enter a valid HTTP(S) URL."), {
          status: 400,
        });
      }
      if (
        !["http:", "https:"].includes(target.protocol) ||
        target.username ||
        target.password
      )
        throw Object.assign(
          new Error("Use HTTP(S) URLs without embedded credentials."),
          { status: 400 },
        );
      if (
        !["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(
          method,
        ) ||
        typeof body !== "string" ||
        !Number.isInteger(timeout) ||
        timeout < 1 ||
        timeout > 45000 ||
        !headers ||
        typeof headers !== "object" ||
        Array.isArray(headers)
      )
        throw Object.assign(
          new Error("Invalid method, headers, body or timeout (1–45000 ms)."),
          { status: 400 },
        );
      const outbound = new Headers();
      for (const [key, value] of Object.entries(headers)) {
        if (
          typeof value !== "string" ||
          /^(host|content-length|connection|transfer-encoding|upgrade|proxy-.*|x-forwarded-.*|forwarded)$/i.test(
            key,
          )
        )
          throw Object.assign(new Error(`Unsupported header: ${key}`), {
            status: 400,
          });
        try {
          outbound.set(key, value);
        } catch {
          throw Object.assign(new Error(`Invalid header: ${key}`), {
            status: 400,
          });
        }
      }
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout);
      const start = performance.now();
      if (!config.allowPrivate)
        dispatcher = await dispatcherFactory(target, {
          signal: controller.signal,
        });
      const upstream = await fetch(target, {
        method,
        headers: outbound,
        body: ["GET", "HEAD"].includes(method) ? undefined : body || undefined,
        signal: controller.signal,
        redirect: "manual",
        ...(dispatcher ? { dispatcher } : {}),
      });
      const chunks = [];
      let size = 0;
      if (upstream.body)
        for await (const chunk of upstream.body) {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) {
            controller.abort();
            throw Object.assign(new Error("Response exceeds 2 MB limit."), {
              status: 413,
            });
          }
          chunks.push(chunk);
        }
      const result = {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: Object.fromEntries(upstream.headers),
        body: Buffer.concat(chunks).toString("utf8"),
        size,
        duration: Math.round(performance.now() - start),
      };
      if (Buffer.byteLength(JSON.stringify(result)) > 4 * 1024 * 1024)
        throw Object.assign(new Error("Encoded response exceeds 4 MB limit."), {
          status: 413,
        });
      return res.json(result);
    } catch (error) {
      if (res.destroyed) return undefined;
      return res.status(timedOut ? 504 : error.status || 502).json({
        error: timedOut
          ? "Request timed out."
          : error.status
            ? error.message
            : "Connection failed. Check URL, availability and TLS certificate.",
      });
    } finally {
      clearTimeout(timer);
      res.off("close", cancel);
      if (dispatcher) await dispatcher.close();
    }
  };
}
