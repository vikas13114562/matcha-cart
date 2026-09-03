// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { POST } from "@/app/api/admin/login/route";

function login(body: unknown = { username: "test-admin", password: "test-password" }) {
  return POST(new Request("https://example.test/api/admin/login", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  vi.stubEnv("ADMIN_USERNAME", "test-admin");
  vi.stubEnv("ADMIN_PASSWORD", "test-password");
  vi.stubEnv("SESSION_SECRET", "test-only-session-secret-at-least-32-characters");
  vi.stubGlobal("crypto", webcrypto);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("deployed admin login", () => {
  it.each(["ADMIN_USERNAME", "ADMIN_PASSWORD"])("explains missing %s without creating a session", async key => {
    vi.stubEnv(key, "");
    const response = await login();
    expect(response.status).toBe(503);
    expect((await response.json()).message).toContain("deployment environment");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it.each(["", "too-short"])("explains an invalid session secret", async secret => {
    vi.stubEnv("SESSION_SECRET", secret);
    const response = await login();
    expect(response.status).toBe(503);
    expect((await response.json()).message).toContain("at least 32 characters");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("rejects incorrect credentials without disclosing configured values", async () => {
    const response = await login({ username: "test-admin", password: "wrong-password" });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Invalid username or password." });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("creates an HttpOnly session with valid configuration and credentials", async () => {
    const response = await login();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("matcha_admin_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });
});
