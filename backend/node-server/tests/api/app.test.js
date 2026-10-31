const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");

process.env.DB_HOST = "127.0.0.1";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "netra_test";

const app = require("../../app");
const db = require("../../db");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  await db.end();
});

test("GET / returns the service status", async () => {
  const response = await fetch(baseUrl);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    message: "NETRA API is running",
    success: true,
  });
});

test("examiner login rejects missing credentials", async () => {
  const response = await fetch(`${baseUrl}/api/auth/examiner/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).success, false);
});

test("adding an examiner rejects incomplete details", async () => {
  const response = await fetch(`${baseUrl}/api/admin/examiners/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullName: "Test Examiner" }),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, "All fields are required.");
});