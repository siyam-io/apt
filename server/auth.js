import { Router } from "express";
import {
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const cookieName = (config) =>
  config.production ? "__Host-apt-session" : "apt-session";
const cookieOptions = (config) => ({
  httpOnly: true,
  secure: config.production,
  sameSite: "lax",
  path: "/",
});
const sessionToken = (req, config) =>
  req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName(config)}=`))
    ?.split("=")[1];
async function passwordHash(password, salt = randomBytes(16).toString("hex")) {
  const key = await derive(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt}:${key.toString("hex")}`;
}
async function matches(password, stored) {
  const [salt, key] = stored.split(":");
  const actual = (await passwordHash(password, salt)).split(":")[1];
  return (
    key.length === actual.length &&
    timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(actual, "hex"))
  );
}
export async function rateLimit(db, key, limit, seconds = 900) {
  const result = await db.query(
    `INSERT INTO rate_limits(key, window_start, count)
    VALUES ($1, floor(extract(epoch from now())/$2)::bigint, 1)
    ON CONFLICT (key) DO UPDATE SET
      count=CASE WHEN rate_limits.window_start=EXCLUDED.window_start THEN rate_limits.count+1 ELSE 1 END,
      window_start=EXCLUDED.window_start RETURNING count`,
    [key, seconds],
  );
  if (result.rows[0].count > limit)
    throw Object.assign(
      new Error("Too many attempts. Please try again later."),
      { status: 429 },
    );
}
export function authenticate(db, config) {
  return async (req, res, next) => {
    const token = sessionToken(req, config);
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      return res.status(401).json({ error: "Please sign in." });
    const result = await db.query(
      "SELECT u.id, u.name, u.email FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()",
      [hash(token)],
    );
    if (!result.rows.length)
      return res
        .status(401)
        .json({ error: "Session expired. Please sign in again." });
    req.user = result.rows[0];
    return next();
  };
}
export function authRoutes(db, config) {
  const router = Router();
  const ipKey = (req) =>
    hash(
      config.production
        ? String(
            req.headers["x-vercel-forwarded-for"] || req.socket.remoteAddress,
          )
            .split(",")[0]
            .trim()
        : req.socket.remoteAddress || "local",
    );
  const createSession = async (req, res, user) => {
    const old = sessionToken(req, config);
    if (old)
      await db.query("DELETE FROM sessions WHERE token_hash=$1", [hash(old)]);
    await db.query("DELETE FROM sessions WHERE expires_at < now()");
    const token = randomBytes(32).toString("hex");
    await db.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
      [hash(token), user.id],
    );
    res.cookie(cookieName(config), token, {
      ...cookieOptions(config),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  };
  router.post("/register", async (req, res) => {
    await rateLimit(db, `register-ip:${ipKey(req)}`, 10);
    const { password, name } = req.body ?? {};
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 80 ||
      typeof password !== "string" ||
      password.length < 12 ||
      Buffer.byteLength(password) > 256
    )
      return res.status(400).json({
        error:
          "Use a valid email, a name (1–80 characters), and a password of at least 12 characters (maximum 256 bytes).",
      });
    const user = { id: randomUUID(), name: name.trim(), email };
    const encoded = await passwordHash(password);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)",
        [user.id, user.name, email, encoded],
      );
      await client.query(
        "INSERT INTO projects(id,user_id,name) VALUES($1,$2,$3)",
        [randomUUID(), user.id, "My first project"],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23505")
        return res.status(409).json({
          error: "Unable to create account with these details. Try signing in.",
        });
      throw error;
    } finally {
      client.release();
    }
    await createSession(req, res, user);
    return res.status(201).json({ user });
  });
  router.post("/login", async (req, res) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase().slice(0, 254)
        : "";
    const password = req.body?.password;
    await rateLimit(db, `login-ip:${ipKey(req)}`, 50);
    await rateLimit(db, `login-email:${email}`, 10);
    if (typeof password !== "string" || Buffer.byteLength(password) > 256)
      return res.status(400).json({ error: "Invalid login details." });
    const result = await db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];
    const valid = await matches(
      password,
      user?.password_hash || `${"0".repeat(32)}:${"0".repeat(128)}`,
    );
    if (!user || !valid)
      return res.status(401).json({ error: "Email or password is incorrect." });
    await createSession(req, res, user);
    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  });
  router.post("/logout", async (req, res) => {
    const token = sessionToken(req, config);
    if (token)
      await db.query("DELETE FROM sessions WHERE token_hash=$1", [hash(token)]);
    res.clearCookie(cookieName(config), cookieOptions(config));
    return res.sendStatus(204);
  });
  router.get("/me", authenticate(db, config), (req, res) =>
    res.json({ user: req.user }),
  );
  return router;
}
