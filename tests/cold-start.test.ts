import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, describe, it } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../src/lib/api-error";
import { createWakeRetry } from "../src/lib/wake-retry";

type Reply = "ok" | "401" | "403" | "500" | "503" | "html" | "hang";
let apiClient: typeof import("../src/lib/apiClient").default;
let script: Reply[] = [];
let meCalls = 0;
let refreshCalls = 0;

const server = createServer((request, response) => {
  const send = (status: number) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        success: status === 200,
        statusCode: status,
        message: status === 200 ? "Success" : "Failed",
        data: status === 200 ? { id: "user" } : null,
      }),
    );
  };
  if (request.url === "/auth/refresh-token") {
    refreshCalls++;
    return send(401);
  }
  meCalls++;
  const reply = script.shift() ?? "ok";
  if (reply === "hang") return setTimeout(() => send(200), 300);
  if (reply === "html") {
    response.writeHead(200, { "Content-Type": "text/html" });
    return response.end("<html>Service waking up</html>");
  }
  send(reply === "ok" ? 200 : Number(reply));
});

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  process.env.NEXT_PUBLIC_API_BASE_URL = `http://127.0.0.1:${port}`;
  // Own module instance: bun shares its cache across test files and the client
  // reads the base URL once at import.
  const isolated = "../src/lib/apiClient?cold-start";
  apiClient = (
    (await import(isolated)) as typeof import("../src/lib/apiClient")
  ).default;
});
after(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
);
beforeEach(() => {
  script = [];
  meCalls = 0;
  refreshCalls = 0;
});

// Mirrors useSession: 401 → guest (null), transient → retried within a window.
function fetchSession(client: QueryClient, windowMs = 2_000) {
  const wake = createWakeRetry(windowMs);
  return client.fetchQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const user = (
          await apiClient<{ id: string }>("/auth/me", {
            timeout: 100,
            suppressSessionExpiry: true,
          })
        ).data;
        wake.reset();
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: wake.retry,
    retryDelay: 20,
  });
}

describe("backend cold start", () => {
  it("loads normally when the backend is already awake", async () => {
    assert.deepEqual(await fetchSession(new QueryClient()), { id: "user" });
    assert.equal(meCalls, 1);
  });
  it("retries a sleeping backend (gateway errors, wake page) until it answers", async () => {
    script = ["503", "html", "503"];
    assert.deepEqual(await fetchSession(new QueryClient()), { id: "user" });
    assert.equal(meCalls, 4);
    assert.equal(refreshCalls, 0);
  });
  it("retries after a first request times out", async () => {
    script = ["hang"];
    assert.deepEqual(await fetchSession(new QueryClient()), { id: "user" });
    assert.equal(meCalls, 2);
  });
  it("stops retrying once the backend stays down past the window", async () => {
    script = Array(1000).fill("503");
    await assert.rejects(fetchSession(new QueryClient(), 300), (error) => {
      assert.ok(error instanceof ApiError && error.isTransient);
      assert.equal(error.sessionExpired, false);
      return true;
    });
    assert.ok(meCalls > 1 && meCalls < 30, `bounded calls, got ${meCalls}`);
  });
  it("resolves a genuinely expired session to guest without retrying", async () => {
    script = ["401"];
    assert.equal(await fetchSession(new QueryClient()), null);
    assert.equal(meCalls, 1);
    assert.equal(refreshCalls, 1);
  });
  it("surfaces 500 and 403 as errors without retrying", async () => {
    for (const status of ["500", "403"] as const) {
      script = [status];
      meCalls = 0;
      await assert.rejects(fetchSession(new QueryClient()), {
        status: Number(status),
        sessionExpired: false,
      });
      assert.equal(meCalls, 1);
    }
  });
  it("sends one request for concurrent session observers", async () => {
    script = ["503"];
    const client = new QueryClient();
    const results = await Promise.all([
      fetchSession(client),
      fetchSession(client),
      fetchSession(client),
    ]);
    for (const result of results) assert.deepEqual(result, { id: "user" });
    assert.equal(meCalls, 2);
  });
});

describe("wake retry policy", () => {
  it("only retries transient failures", () => {
    const wake = createWakeRetry();
    for (const status of [0, 502, 503, 504])
      assert.equal(wake.retry(0, new ApiError(status, "")), true);
    for (const status of [400, 401, 403, 404, 500])
      assert.equal(wake.retry(0, new ApiError(status, "")), false);
    assert.equal(wake.retry(0, new Error("other")), false);
  });
  it("caps the delay and starts a fresh window after giving up", () => {
    let clock = 0;
    const wake = createWakeRetry(1_000, () => clock);
    assert.equal(wake.retryDelay(10), 8_000);
    assert.equal(wake.retry(0, new ApiError(503, "")), true);
    clock = 1_000;
    assert.equal(wake.retry(1, new ApiError(503, "")), false);
    assert.equal(wake.retry(0, new ApiError(503, "")), true);
  });
});
