import http from "node:http";
import request from "supertest";
import { fixture, register } from "./helpers.js";
let setup;
let agent;

let upstream;
let base;
beforeAll(async () => {
  setup = await fixture();
  agent = request.agent(setup.app);
  await register(agent);
  upstream = http.createServer(async (req, res) => {
    if (req.url === "/slow") {
      setTimeout(() => res.end("late"), 150);
      return;
    }
    if (req.url === "/large") {
      res.end("x".repeat(5 * 1024 * 1024 + 1));
      return;
    }
    if (req.url === "/redirect") {
      res.writeHead(302, { location: "/echo" });
      res.end();
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    res.writeHead(201, {
      "content-type": "application/json",
      "x-example": "yes",
    });
    res.end(
      JSON.stringify({
        method: req.method,
        url: req.url,
        auth: req.headers.authorization,
        body,
      }),
    );
  });
  await new Promise((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${upstream.address().port}`;
});
afterAll(async () => {
  await new Promise((resolve) => upstream.close(resolve));
  await setup.close();
});

test("forwards method, query, headers and body, returning response metadata", async () => {
  const result = await agent
    .post("/api/request")
    .set("X-APT-Client", "web")
    .send({
      url: `${base}/echo?q=hello`,
      method: "POST",
      headers: { Authorization: "Bearer test" },
      body: '{"ok":true}',
    });
  expect(result.status).toBe(200);
  expect(result.body.status).toBe(201);
  expect(JSON.parse(result.body.body)).toEqual({
    method: "POST",
    url: "/echo?q=hello",
    auth: "Bearer test",
    body: '{"ok":true}',
  });
  expect(result.body.headers["x-example"]).toBe("yes");
  expect(result.body.size).toBeGreaterThan(0);
});
test.each(["file:///etc/passwd", "invalid", "ftp://example.com"])(
  "rejects invalid target %s",
  async (url) => {
    expect(
      (
        await agent
          .post("/api/request")
          .set("X-APT-Client", "web")
          .send({ url })
      ).status,
    ).toBe(400);
  },
);
test("rejects invalid method", async () => {
  expect(
    (
      await agent
        .post("/api/request")
        .set("X-APT-Client", "web")
        .send({ url: base, method: "CONNECT" })
    ).status,
  ).toBe(400);
});
test("rejects cross-origin proxy access", async () => {
  expect(
    (
      await agent
        .post("/api/request")
        .set("X-APT-Client", "web")
        .set("Origin", "https://evil.example")
        .send({ url: base })
    ).status,
  ).toBe(403);
});
test("returns timeout error", async () => {
  const result = await agent
    .post("/api/request")
    .set("X-APT-Client", "web")
    .send({ url: `${base}/slow`, timeout: 30 });
  expect(result.status).toBe(504);
});
test("does not automatically follow redirects", async () => {
  const result = await agent
    .post("/api/request")
    .set("X-APT-Client", "web")
    .send({ url: `${base}/redirect` });
  expect(result.body.status).toBe(302);
});
test("rejects oversized responses", async () => {
  expect(
    (
      await agent
        .post("/api/request")
        .set("X-APT-Client", "web")
        .send({ url: `${base}/large` })
    ).status,
  ).toBe(413);
});
test("malformed JSON returns structured error", async () => {
  const result = await agent
    .post("/api/request")
    .set("X-APT-Client", "web")
    .set("Content-Type", "application/json")
    .send("{");
  expect(result.status).toBe(400);
  expect(result.body.error).toBeTruthy();
});
