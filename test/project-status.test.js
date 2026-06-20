const test = require("node:test");
const assert = require("node:assert/strict");
const { checkProject, isPlaceholderUrl, looksLikePlaceholderPage, normalizeTimeout } = require("../lib/project-status");

function response(body, { status = 200, contentType = "text/html" } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name === "content-type" ? contentType : null },
    text: async () => body,
  };
}

test("placeholder URLs are planned", async () => {
  assert.equal(isPlaceholderUrl("#"), true);
  assert.equal((await checkProject({ name: "Planned", url: "#" })).status, "blue");
});

test("healthy HTML pages are live", async () => {
  const result = await checkProject({ name: "Live", url: "https://example.com" }, {
    fetchImpl: async () => response("<!doctype html><html><head><title>Live</title></head><body>Ready</body></html>"),
  });
  assert.equal(result.status, "green");
});

test("HTTP errors and placeholder pages need attention", async () => {
  const httpError = await checkProject({ url: "https://example.com" }, {
    fetchImpl: async () => response("<html><body>nope</body></html>", { status: 503 }),
  });
  assert.equal(httpError.status, "yellow");
  assert.equal(looksLikePlaceholderPage("<html><head><title>Coming soon</title></head></html>"), true);
});

test("invalid configuration falls back to a positive timeout", () => {
  assert.equal(normalizeTimeout("nope", 1234), 1234);
  assert.equal(normalizeTimeout(-1, 1234), 1234);
});
