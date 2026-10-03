import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError, toApiError } from "../src/lib/api-error";
import { routes, safeNext } from "../src/routes/app.routes";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../src/validation/auth.validation";

describe("auth validation parity", () => {
  it("trims names and requires eight characters for registration", () => {
    assert.equal(
      registerSchema.safeParse({
        name: " ",
        email: "person@example.test",
        password: "12345678",
      }).success,
      false,
    );
    assert.equal(
      registerSchema.safeParse({
        name: "Person",
        email: "person@example.test",
        password: "1234567",
      }).success,
      false,
    );
    assert.equal(
      registerSchema.parse({
        name: " Person ",
        email: "person@example.test",
        password: "12345678",
      }).name,
      "Person",
    );
  });
  it("login requires a nonempty password, not eight characters", () => {
    assert.equal(
      loginSchema.safeParse({ email: "person@example.test", password: "x" })
        .success,
      true,
    );
    assert.equal(
      loginSchema.safeParse({ email: "person@example.test", password: "" })
        .success,
      false,
    );
  });
  it("checks exact numeric OTP length", () => {
    for (const otp of ["12345", "1234567", "abcdef", "123 56"]) {
      assert.equal(
        verifyEmailSchema.safeParse({ email: "person@example.test", otp })
          .success,
        false,
      );
    }
    assert.equal(
      verifyEmailSchema.safeParse({
        email: "person@example.test",
        otp: "123456",
      }).success,
      true,
    );
  });
  it("validates recovery email and new password", () => {
    assert.equal(
      forgotPasswordSchema.safeParse({ email: "invalid" }).success,
      false,
    );
    assert.equal(
      resetPasswordSchema.safeParse({
        email: "person@example.test",
        otp: "123456",
        newPassword: "short",
      }).success,
      false,
    );
    assert.equal(
      resetPasswordSchema.safeParse({
        email: "person@example.test",
        otp: "123456",
        newPassword: "12345678",
      }).success,
      true,
    );
  });
});

describe("safe return paths", () => {
  it("preserves internal path, query and hash", () => {
    assert.equal(safeNext("/profile"), "/profile");
    assert.equal(
      safeNext("/dashboard?sort=latest#posts"),
      "/dashboard?sort=latest#posts",
    );
  });
  it("rejects external and browser-normalized external destinations", () => {
    for (const value of [
      null,
      "//evil.test",
      "https://evil.test",
      "/\\evil.test",
      "/\tevil.test",
      "/login",
      "/forgot-password",
      "/reset-password?email=x",
      "/register",
    ]) {
      assert.equal(safeNext(value), routes.dashboard);
    }
  });
});

describe("safe API error feedback", () => {
  it("preserves curated validation and auth messages", () => {
    assert.equal(
      new ApiError(401, "Invalid email or password").userMessage,
      "Invalid email or password",
    );
    assert.equal(
      new ApiError(400, "Invalid verification code").userMessage,
      "Invalid verification code",
    );
  });
  it("never exposes server output", () => {
    assert.equal(
      new ApiError(500, "database password secret").userMessage,
      "Something went wrong on our side. Please try again.",
    );
    assert.match(
      toApiError(new Error("private network details")).userMessage,
      /Couldn't reach the server/,
    );
  });
  it("handles plain-text rate limiting without rendering the body", () => {
    assert.equal(
      new ApiError(429, "<html>private body</html>").userMessage,
      "Too many attempts. Please try again later.",
    );
  });
  it("retains structured field errors", () => {
    const error = new ApiError(400, "Invalid fields", {
      errors: { email: "Invalid email address", otp: 123 },
    });
    assert.deepEqual(error.fieldErrors, { email: "Invalid email address" });
  });
});
