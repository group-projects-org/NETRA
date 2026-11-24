const { after, before, describe, it } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
require("dotenv").config();
process.env.DB_HOST = "127.0.0.1";
process.env.DB_USER = "test";
process.env.DB_PASSWORD = "test";
process.env.DB_NAME = "netra_test";
process.env.JWT_SECRET = "test-secret-key";

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
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await db.end();
});

describe("Auth Routes Validation", () => {
  it("rejects login with blank examinerId", async () => {
    const res = await fetch(`${baseUrl}/api/auth/examiner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examinerId: "   ", password: "secret" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Examiner ID and password are required.");
  });

  it("rejects login with missing password", async () => {
    const res = await fetch(`${baseUrl}/api/auth/examiner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examinerId: "NETRA-123" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Examiner ID and password are required.");
  });
});

describe("Examiner Routes Validation", () => {
  it("rejects add examiner with invalid email", async () => {
    const res = await fetch(`${baseUrl}/api/admin/examiners/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "John Doe",
        email: "not-an-email",
        phone: "9876543210",
        department: "Computer Science",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid email address.");
  });

  it("rejects add examiner with invalid phone number", async () => {
    const res = await fetch(`${baseUrl}/api/admin/examiners/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "John Doe",
        email: "john@example.com",
        phone: "123",
        department: "Computer Science",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid phone number.");
  });
});

describe("Notification Routes Validation", () => {
  it("GET /api/notifications/examiners requires department query param", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/examiners`);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Department is required.");
  });

  it("POST /api/notifications/send rejects invalid payload", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", message: "" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it("POST /api/notifications/send rejects when audienceType is SELECTED_EXAMINERS but examinerIds is missing", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test",
        message: "Test message",
        audienceType: "SELECTED_EXAMINERS",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it("GET /api/notifications/recent rejects unauthenticated request", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/recent`);
    assert.equal(res.status, 401);
  });

  it("GET /api/notifications/my-notifications rejects unauthenticated request", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/my-notifications`);
    assert.equal(res.status, 401);
  });

  it("PATCH /api/notifications/:id/read rejects invalid notification ID", async () => {
    const token = jwt.sign({ id: 1, role: "EXAMINER" }, process.env.JWT_SECRET);
    const res = await fetch(`${baseUrl}/api/notifications/abc/read`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.message, "Invalid notification ID.");
  });

  it("GET /api/notifications/unread-count rejects unauthenticated request", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/unread-count`);
    assert.equal(res.status, 401);
  });

  it("PATCH /api/notifications/mark-all-read rejects unauthenticated request", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/mark-all-read`, {
      method: "PATCH",
    });
    assert.equal(res.status, 401);
  });
});

describe("Event Routes Validation", () => {
  it("POST /api/events/create rejects missing required event details", async () => {
    const res = await fetch(`${baseUrl}/api/events/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it("POST /api/events/create rejects when end time is before start time", async () => {
    const res = await fetch(`${baseUrl}/api/events/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Event",
        eventDate: "2026-12-01",
        startTime: "14:00",
        endTime: "10:00",
        audienceType: "ALL_EXAMINERS",
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.message, "Invalid date or time. End time must be after start time.");
  });

  it("GET /api/events/my-events rejects unauthenticated request", async () => {
    const res = await fetch(`${baseUrl}/api/events/my-events`);
    assert.equal(res.status, 401);
  });

  it("GET /api/events/:id rejects invalid event ID format", async () => {
    const token = jwt.sign({ id: 1, role: "EXAMINER" }, process.env.JWT_SECRET);
    const res = await fetch(`${baseUrl}/api/events/invalid-id`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.message, "Invalid event ID.");
  });
});
