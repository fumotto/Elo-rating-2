import { describe, expect, it } from "vitest";
import { applyEloDelta, calcElo, calcEloDelta } from "./elo";

describe("calcEloDelta", () => {
  it("returns symmetric deltas for equal teams", () => {
    const delta = calcEloDelta([1500, 1500, 1500], [1500, 1500, 1500], 32);
    expect(delta.plus).toBe(16);
    expect(delta.minus).toBe(-16);
  });

  it("gives smaller gain when favorites win", () => {
    const delta = calcEloDelta([1800, 1800, 1800], [1200, 1200, 1200], 32);
    expect(delta.plus).toBeLessThan(16);
    expect(delta.minus).toBeGreaterThan(-16);
  });
});

describe("calcElo", () => {
  it("matches the legacy 3v3 team calculation behavior", () => {
    const result = calcElo(1500, 1520, 1480, 1500, 1490, 1510, 32);
    expect(result).toEqual({
      winner1: 1516,
      winner2: 1536,
      winner3: 1496,
      loser1: 1484,
      loser2: 1474,
      loser3: 1494,
    });
  });

  it("applies the same delta to all members in each team", () => {
    const delta = calcEloDelta([1600, 1500, 1400], [1550, 1450, 1350], 32);
    const result = applyEloDelta([1600, 1500, 1400], [1550, 1450, 1350], delta);

    expect(result.winner1 - 1600).toBe(delta.plus);
    expect(result.winner2 - 1500).toBe(delta.plus);
    expect(result.winner3 - 1400).toBe(delta.plus);
    expect(result.loser1 - 1550).toBe(delta.minus);
    expect(result.loser2 - 1450).toBe(delta.minus);
    expect(result.loser3 - 1350).toBe(delta.minus);
  });
});

describe("role helpers", () => {
  it("allows match registration for normal and admin users", async () => {
    const { canRegisterMatches } = await import("../types");
    expect(canRegisterMatches("normal_user")).toBe(true);
    expect(canRegisterMatches("admin_user")).toBe(true);
    expect(canRegisterMatches("guest_user")).toBe(false);
  });
});
