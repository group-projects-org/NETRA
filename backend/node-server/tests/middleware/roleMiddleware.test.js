const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const allowRoles = require("../../middleware/roleMiddleware");

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

describe("roleMiddleware - allowRoles", () => {
  it("returns 403 when req.user is undefined", () => {
    const middleware = allowRoles("ADMIN");
    const req = {};
    const res = createMockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.jsonData, {
      success: false,
      message: "You are not authorized to access this resource.",
    });
    assert.equal(nextCalled, false);
  });

  it("returns 403 when user role is not in allowed roles", () => {
    const middleware = allowRoles("ADMIN");
    const req = { user: { role: "EXAMINER" } };
    const res = createMockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonData.message, "You are not authorized to access this resource.");
    assert.equal(nextCalled, false);
  });

  it("calls next() when user role matches allowed single role", () => {
    const middleware = allowRoles("EXAMINER");
    const req = { user: { role: "EXAMINER" } };
    const res = createMockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
  });

  it("calls next() when user role matches one of multiple allowed roles", () => {
    const middleware = allowRoles("ADMIN", "EXAMINER");
    const req = { user: { role: "ADMIN" } };
    const res = createMockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
  });
});
