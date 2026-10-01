import request from "supertest";
import http from "node:http";
import { Agent } from "undici";
import { createApp } from "../server/app.js";
import { fixture, mutation, register } from "./helpers.js";

let setup;
let agent;
test("proxy fetch is compatible with its pinned connection dispatcher", async () => {
  const upstream = http.createServer((req, res) =>
    res.end("dispatcher response"),
  );
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  try {
    const app = createApp({
      db: setup.db,
      config: { production: false, appUrl: "", allowPrivate: false },
      dispatcherFactory: async () => new Agent(),
    });
    const session = request.agent(app);
    await mutation(session, "post", "/api/auth/login", {
      email: "owner@example.test",
      password: "test-password-2026",
    });
    const result = await mutation(session, "post", "/api/request", {
      url: `http://127.0.0.1:${upstream.address().port}`,
    });
    expect(result.status).toBe(200);
    expect(result.body.body).toBe("dispatcher response");
  } finally {
    await new Promise((resolve) => upstream.close(resolve));
  }
});
beforeAll(async () => {
  setup = await fixture({ allowPrivate: false });
  agent = request.agent(setup.app);
  await register(agent);
});
afterAll(async () => {
  await setup?.close();
});
test.each([
  "http://127.0.0.1",
  "http://localhost",
  "http://169.254.169.254/latest/meta-data",
  "http://[::1]",
  "http://2130706433",
  "http://[::ffff:127.0.0.1]",
])("hosted proxy blocks private target %s", async (url) => {
  const result = await mutation(agent, "post", "/api/request", { url });
  expect(result.status).toBe(400);
  expect(result.body.error).toContain("public internet");
});
test("hosted authentication uses secure host-only cookie and accepts configured HTTPS origin", async () => {
  const hosted = createApp({
    db: setup.db,
    config: {
      production: true,
      appUrl: "https://apt.example.test",
      allowPrivate: false,
    },
  });
  const response = await mutation(request(hosted), "post", "/api/auth/login", {
    email: "owner@example.test",
    password: "test-password-2026",
  })
    .set("Host", "apt.example.test")
    .set("Origin", "https://apt.example.test");
  expect(response.status).toBe(200);
  expect(response.headers["set-cookie"][0]).toContain("__Host-apt-session=");
  expect(response.headers["set-cookie"][0]).toContain("Secure");
  expect(response.headers["cache-control"]).toBe("no-store");
});
test("unconfigured deployment fails closed", async () => {
  const hosted = createApp({
    db: setup.db,
    config: { production: true, appUrl: "", allowPrivate: false },
  });
  expect((await request(hosted).get("/api/config")).status).toBe(503);
});
test("missing database shows setup state and does not allow login", async () => {
  const app = createApp({
    db: null,
    config: { production: false, appUrl: "", allowPrivate: true },
  });
  expect((await request(app).get("/api/config")).body.configured).toBe(false);
  expect(
    (await mutation(request(app), "post", "/api/auth/login", {})).status,
  ).toBe(503);
});
