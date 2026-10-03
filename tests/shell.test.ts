import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { clearSessionCache, sessionQueryKey } from "../src/lib/session-cache";
import { executionStatus } from "../src/lib/status";
import { isActiveRoute, navItems } from "../src/routes/nav.routes";
import type { User } from "../src/types/auth.type";

const user: User = {
  id: "test-user",
  name: "Test User",
  email: "test@example.test",
  emailVerified: true,
  avatarUrl: null,
  avatarPublicId: null,
  role: "USER",
  isPremium: false,
  premiumSince: null,
  status: "ACTIVE",
  isDeleted: false,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

test("free navigation includes upgrade, not premium or admin links", () => {
  const labels = navItems
    .filter((item) => item.visible(user))
    .map((item) => item.label);
  assert(labels.includes("Upgrade"));
  assert(!labels.includes("Upcoming features"));
  assert(!labels.includes("Admin"));
});

test("premium navigation uses the backend flag, independently of role", () => {
  const labels = navItems
    .filter((item) => item.visible({ ...user, isPremium: true }))
    .map((item) => item.label);
  assert(labels.includes("Upcoming features"));
  assert(!labels.includes("Upgrade"));
  assert(!labels.includes("Admin"));
});

test("both administrator roles can see admin navigation", () => {
  const item = navItems.find((item) => item.label === "Admin");
  assert.equal(item?.visible({ ...user, role: "ADMIN" }), true);
  assert.equal(item?.visible({ ...user, role: "SUPER_ADMIN" }), true);
});

test("active navigation matches a route or its children, not a prefix collision", () => {
  assert.equal(isActiveRoute("/executions", "/executions"), true);
  assert.equal(isActiveRoute("/executions/id", "/executions"), true);
  assert.equal(isActiveRoute("/executions-other", "/executions"), false);
});

test("every backend execution status has an explicit label", () => {
  assert.equal(Object.keys(executionStatus).length, 5);
  assert.equal(executionStatus.PENDING.label, "Queued");
  assert.equal(executionStatus.COMPLETED.label, "Published");
  assert.equal(executionStatus.PARTIALLY_COMPLETED.label, "Partial");
});

test("logout notifies mounted session observers and removes private cached data", () => {
  const client = new QueryClient();
  client.setQueryData(sessionQueryKey, user);
  client.setQueryData(["connections"], [{ id: "private" }]);
  const observer = new QueryObserver<User | null>(client, {
    queryKey: sessionQueryKey,
    enabled: false,
  });
  let receivedGuest = false;
  const unsubscribe = observer.subscribe((result) => {
    if (result.data === null) receivedGuest = true;
  });
  const query = client.getQueryCache().find({ queryKey: sessionQueryKey });
  clearSessionCache(client);
  assert.equal(receivedGuest, true);
  assert.equal(client.getQueryData(sessionQueryKey), null);
  assert.equal(
    client.getQueryCache().find({ queryKey: sessionQueryKey }),
    query,
  );
  assert.equal(client.getQueryData(["connections"]), undefined);
  unsubscribe();
  client.clear();
});
