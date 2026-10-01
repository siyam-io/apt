import request from "supertest";
import { fixture, register, mutation } from "./helpers.js";

let setup;
let alice;
let bob;
let project;
beforeAll(async () => {
  setup = await fixture();
  alice = request.agent(setup.app);
  bob = request.agent(setup.app);
  await register(alice);
  await register(bob, "bob@example.test");
  project = (await alice.get("/api/projects")).body.projects[0];
});
afterAll(async () => {
  await setup?.close();
});

test("unauthenticated access cannot read projects or use proxy", async () => {
  expect((await request(setup.app).get("/api/projects")).status).toBe(401);
  expect(
    (
      await mutation(request(setup.app), "post", "/api/request", {
        url: "https://example.com",
      })
    ).status,
  ).toBe(401);
});
test("registration hashes passwords and gives private default project", async () => {
  const { rows } = await setup.db.query(
    "SELECT password_hash FROM users WHERE email=$1",
    ["owner@example.test"],
  );
  expect(rows[0].password_hash).not.toContain("test-password");
  expect(project.name).toBe("My first project");
  expect((await alice.get("/api/auth/me")).body.user.email).toBe(
    "owner@example.test",
  );
});
test("login normalizes email and cookie is HttpOnly", async () => {
  const result = await mutation(request(setup.app), "post", "/api/auth/login", {
    email: " OWNER@example.test ",
    password: "test-password-2026",
  });
  expect(result.status).toBe(200);
  expect(result.headers["set-cookie"][0]).toContain("HttpOnly");
  expect(result.headers["set-cookie"][0]).toContain("SameSite=Lax");
});
test("invalid credentials fail without exposing account details", async () => {
  const result = await mutation(request(setup.app), "post", "/api/auth/login", {
    email: "owner@example.test",
    password: "incorrect",
  });
  expect(result.status).toBe(401);
  expect(result.body.error).toBe("Email or password is incorrect.");
});
test("mutations require same-origin client header", async () => {
  expect(
    (await alice.post("/api/projects").send({ name: "no header" })).status,
  ).toBe(403);
  expect(
    (
      await mutation(alice, "post", "/api/projects", { name: "evil" }).set(
        "Origin",
        "https://evil.test",
      )
    ).status,
  ).toBe(403);
});
test("project ownership prevents listing, editing and deleting another user data", async () => {
  expect((await bob.get(`/api/projects/${project.id}/requests`)).status).toBe(
    404,
  );
  expect(
    (
      await mutation(bob, "patch", `/api/projects/${project.id}`, {
        name: "stolen",
      })
    ).status,
  ).toBe(404);
  expect(
    (await mutation(bob, "delete", `/api/projects/${project.id}`)).status,
  ).toBe(404);
});
test("named requests update by ID and sanitize secrets server-side", async () => {
  const created = await mutation(
    alice,
    "post",
    `/api/projects/${project.id}/requests`,
    {
      name: "List users",
      method: "GET",
      url: "https://example.com/users?token=secret&page=1",
      headers: [{ key: "Authorization", value: "secret", enabled: true }],
      params: [],
      body: "",
      timeout: 30000,
    },
  );
  expect(created.status).toBe(201);
  const item = created.body.request;
  expect(item.headers).toEqual([]);
  expect(item.url).not.toContain("secret");
  expect(
    (
      await mutation(
        bob,
        "put",
        `/api/projects/${project.id}/requests/${item.id}`,
        { ...item, name: "stolen" },
      )
    ).status,
  ).toBe(404);
  const edited = await mutation(
    alice,
    "put",
    `/api/projects/${project.id}/requests/${item.id}`,
    { ...item, name: "Fetch users" },
  );
  expect(edited.status).toBe(200);
  expect(edited.body.request.name).toBe("Fetch users");
  expect(
    (await alice.get(`/api/projects/${project.id}/requests`)).body.requests,
  ).toHaveLength(1);
});
test("empty request names rejected", async () => {
  expect(
    (
      await mutation(alice, "post", `/api/projects/${project.id}/requests`, {
        name: "",
        url: "https://example.com",
      })
    ).status,
  ).toBe(400);
});
test("project can be renamed and deleted with children", async () => {
  const created = await mutation(alice, "post", "/api/projects", {
    name: "Temporary project",
  });
  expect(created.status).toBe(201);
  const id = created.body.project.id;
  expect(
    (
      await mutation(alice, "patch", `/api/projects/${id}`, {
        name: "Renamed project",
      })
    ).body.project.name,
  ).toBe("Renamed project");
  expect((await mutation(alice, "delete", `/api/projects/${id}`)).status).toBe(
    204,
  );
  expect((await alice.get(`/api/projects/${id}/requests`)).status).toBe(404);
});
test("history excludes bodies and is private to project owner", async () => {
  const result = await mutation(
    alice,
    "post",
    `/api/projects/${project.id}/history`,
    {
      name: "History",
      url: "https://example.com",
      method: "POST",
      body: "secret",
      headers: [],
      params: [],
      timeout: 30000,
    },
  );
  expect(result.status).toBe(201);
  expect(result.body.request.body).toBe("");
  expect((await bob.get(`/api/projects/${project.id}/history`)).status).toBe(
    404,
  );
});
test("logout revokes database session", async () => {
  const agent = request.agent(setup.app);
  await mutation(agent, "post", "/api/auth/login", {
    email: "owner@example.test",
    password: "test-password-2026",
  });
  expect((await mutation(agent, "post", "/api/auth/logout", {})).status).toBe(
    204,
  );
  expect((await agent.get("/api/projects")).status).toBe(401);
});
test("expired sessions cannot authorize", async () => {
  const agent = request.agent(setup.app);
  await register(agent, "expired@example.test");
  await setup.db.query(
    "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id=(SELECT id FROM users WHERE email=$1)",
    ["expired@example.test"],
  );
  expect((await agent.get("/api/projects")).status).toBe(401);
});
test("login rate limit is persisted across app instances", async () => {
  await setup.db.query(
    "INSERT INTO rate_limits (key, window_start, count) VALUES ($1, floor(extract(epoch from now())/900)::bigint, 10) ON CONFLICT (key) DO UPDATE SET count=10",
    ["login-email:limited@example.test"],
  );
  const result = await mutation(request(setup.app), "post", "/api/auth/login", {
    email: "limited@example.test",
    password: "wrong-password",
  });
  expect(result.status).toBe(429);
});
