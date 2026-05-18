import { describe, it, expect } from "vitest";
import { savingsRateMessage } from "./savingsRate";

describe("savingsRateMessage", () => {
  it("warnt bei einer Quote unter dem deutschen Durchschnitt", () => {
    expect(savingsRateMessage(8)).toContain("leicht zu erreichen");
  });

  it("ordnet eine Quote zwischen Durchschnitt und Empfehlung ein", () => {
    expect(savingsRateMessage(13)).toContain("unter der Finanzfluss-Empfehlung");
  });

  it("bestätigt eine Quote im empfohlenen Korridor", () => {
    expect(savingsRateMessage(18)).toContain("empfohlenen Korridor");
  });

  it("warnt bei einer sehr hohen Quote", () => {
    expect(savingsRateMessage(25)).toContain("Hohe Sparquote");
  });

  it("zählt die Korridor-Untergrenze (15 %) noch zum Korridor", () => {
    expect(savingsRateMessage(15)).toContain("empfohlenen Korridor");
  });

  it("zählt die Korridor-Obergrenze (20 %) noch zum Korridor", () => {
    expect(savingsRateMessage(20)).toContain("empfohlenen Korridor");
  });
});
