import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";

let apiClient: typeof import("../src/lib/apiClient").default;
let refreshCount = 0;
let authenticated = false;
let refreshFailure = 0;
let businessCalls = 0;
const calls = new Map<string, number>();
const server = createServer(async (request, response) => {
  const path = request.url ?? "";
  calls.set(path, (calls.get(path) ?? 0) + 1);
  response.setHeader("Content-Type", "application/json");
  let status = 200;
  if (path === "/auth/refresh-token") {
    refreshCount++;
    await new Promise((resolve) => setTimeout(resolve, 50));
    status = refreshFailure || 200;
    authenticated = status === 200;
  } else if (path === "/auth/login") {
    businessCalls++;
    status = 401;
  } else if (!authenticated) {
    status = 401;
  }
  response.writeHead(status);
  response.end(
    JSON.stringify({
      success: status === 200,
      statusCode: status,
      message: status === 200 ? "Success" : "Invalid email or password",
      data: status === 200 ? { id: "test-user" } : null,
    }),
  );
});

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  process.env.NEXT_PUBLIC_API_BASE_URL = `http://127.0.0.1:${address.port}`;
  apiClient = (await import("../src/lib/apiClient")).default;
});
after(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
);

describe("authentication request refresh", () => {
  it("shares one refresh for parallel protected failures and retries each once", async () => {
    const results = await Promise.all([
      apiClient("/protected/a"),
      apiClient("/protected/b"),
      apiClient("/protected/c"),
    ]);
    assert.equal(refreshCount, 1);
    assert.equal(results.length, 3);
    for (const path of ["/protected/a", "/protected/b", "/protected/c"])
      assert.equal(calls.get(path), 2);
  });
  it("never refreshes a wrong-password business response or retries its mutation", async () => {
    await assert.rejects(apiClient("/auth/login", { method: "POST" }), {
      status: 401,
    });
    assert.equal(refreshCount, 1);
    assert.equal(businessCalls, 1);
  });
  it("preserves a transient refresh failure instead of treating it as guest", async () => {
    authenticated = false;
    refreshFailure = 503;
    await assert.rejects(apiClient("/protected/transient"), { status: 503 });
    assert.equal(calls.get("/protected/transient"), 1);
  });
  it("marks an authentication refresh failure as session expiry", async () => {
    refreshFailure = 401;
    await assert.rejects(apiClient("/protected/expired"), {
      status: 401,
      sessionExpired: true,
    });
    assert.equal(calls.get("/protected/expired"), 1);
  });
});
