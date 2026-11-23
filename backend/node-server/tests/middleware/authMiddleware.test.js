const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret-key";

const verifyToken = require("../../middleware/authMiddleware");

function createMockRes() {
  const res = {
    statusCode: null,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
}

describe("authMiddleware - verifyToken", () => {
  it("returns 401 when authorization header is missing", () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    verifyToken(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonData, {
      success: false,
      message: "Authentication token is required.",
    });
    assert.equal(nextCalled, false);
  });

  it("returns 401 when authorization header does not start with Bearer", () => {
    const req = { headers: { authorization: "Basic 12345" } };
    const res = createMockRes();
    let nextCalled = false;

    verifyToken(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData.message, "Authentication token is required.");
    assert.equal(nextCalled, false);
  });

  it("returns 401 when token is invalid or corrupted", () => {
    const req = { headers: { authorization: "Bearer invalid.token.value" } };
    const res = createMockRes();
    let nextCalled = false;

    verifyToken(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 401);
    assert.equal(res.jsonData.message, "Invalid or expired token.");
    assert.equal(nextCalled, false);
  });

  it("sets req.user and calls next() when valid token is provided", () => {
    const payload = { id: 101, examinerId: "NETRA-1234", role: "EXAMINER" };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    let nextCalled = false;

    verifyToken(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 101);
    assert.equal(req.user.examinerId, "NETRA-1234");
    assert.equal(req.user.role, "EXAMINER");
  });
});
