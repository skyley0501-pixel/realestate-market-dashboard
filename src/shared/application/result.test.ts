import { describe, expect, it } from "vitest";
import { Result } from "./result";

describe("Result", () => {
  it("okはmatchでonOkに値を渡す", () => {
    const result = Result.ok<number, string>(42);
    expect(result.isOk).toBe(true);
    expect(
      result.match(
        (v) => v * 2,
        () => -1,
      ),
    ).toBe(84);
  });

  it("errはmatchでonErrにエラーを渡す", () => {
    const result = Result.err<number, string>("failure");
    expect(result.isOk).toBe(false);
    expect(
      result.match(
        () => "unreachable",
        (e) => `error: ${e}`,
      ),
    ).toBe("error: failure");
  });
});
