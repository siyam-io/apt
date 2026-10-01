export function readConfig(env = process.env) {
  const production = env.VERCEL === "1" || env.NODE_ENV === "production";
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
    previewUrl: env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "",
  };
}
export function security(config) {
  return (req, res, next) => {
    res.set({
      "Content-Security-Policy":
        "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    if (req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
    const allowed = config.production
      ? [config.appUrl, config.previewUrl].filter(Boolean)
      : [`http://${req.headers.host}`];
    if (
      config.production &&
      (!config.appUrl.startsWith("https://") ||
        !allowed.some((origin) => new URL(origin).host === req.headers.host))
    )
      return res.status(503).json({
        error: "Configure APP_URL with this deployment’s HTTPS origin.",
      });
    if (
      !config.production &&
      !["127.0.0.1", "localhost"].includes(req.headers.host?.split(":")[0])
    )
      return res.status(403).json({ error: "Local access only." });
    if (req.headers.origin && !allowed.includes(req.headers.origin))
      return res.status(403).json({ error: "Cross-origin access denied." });
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.path.startsWith("/api/") &&
      req.path !== "/api/echo" &&
      req.headers["x-apt-client"] !== "web"
    )
      return res
        .status(403)
        .json({ error: "Same-origin client header required." });
    return next();
  };
}
