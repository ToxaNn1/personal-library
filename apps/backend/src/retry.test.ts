import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "./errors.js";
import { retry } from "./retry.js";

function networkError(code: string): Error {
  return Object.assign(new Error("connection lost"), { code });
}

describe("retry", () => {
  it("does not retry a client error", async () => {
    const fn = vi.fn().mockRejectedValue(new ValidationError("bad input"));

    await expect(retry(fn, { retries: 3, baseMs: 1 })).rejects.toBeInstanceOf(ValidationError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries a network error until it succeeds", async () => {
    const fn = vi.fn().mockRejectedValueOnce(networkError("ECONNRESET")).mockResolvedValue("done");

    await expect(retry(fn, { retries: 3, baseMs: 1 })).resolves.toBe("done");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gives up after the configured number of retries", async () => {
    const fn = vi.fn().mockRejectedValue(networkError("ECONNREFUSED"));

    await expect(retry(fn, { retries: 2, baseMs: 1 })).rejects.toThrow("connection lost");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
