import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => new Promise((resolve) => server.close(resolve)));

test("health endpoint reports demo mode", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.mode, "demo-memory");
});

test("customer can authenticate and read owned vehicles", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "customer@autoserve.demo", password: "demo123" }),
  });
  const login = await loginResponse.json();
  assert.equal(loginResponse.status, 200);
  assert.equal(login.data.user.role, "customer");

  const response = await fetch(`${baseUrl}/api/vehicles`, { headers: { authorization: `Bearer ${login.data.token}` } });
  const vehicles = await response.json();
  assert.equal(response.status, 200);
  assert.equal(vehicles.data.length, 2);
  assert.ok(vehicles.data.every((vehicle) => vehicle.customerId === login.data.user.id));
});

test("protected endpoints reject unauthenticated requests", async () => {
  const response = await fetch(`${baseUrl}/api/bookings`);
  assert.equal(response.status, 401);
});
