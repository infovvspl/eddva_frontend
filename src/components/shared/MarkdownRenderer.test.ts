import { describe, expect, it } from "vitest";
import { formatMarkdown } from "./MarkdownRenderer";

describe("formatMarkdown", () => {
  it("repairs inline math split across blank lines", () => {
    const formatted = formatMarkdown("$f\n\n(0) = 0^2 - 3(0) + 2$");

    expect(formatted).toContain("$f$");
    expect(formatted).toContain("$(0) = 0^2 - 3(0) + 2$");
  });

  it("moves a leading exam year into EXAMTAG", () => {
    const formatted = formatMarkdown("Q1. CBSE Class 10 2021: Find the roots.");

    expect(formatted).toBe("1. [EXAMTAG: CBSE Class 10 2021] Find the roots.");
  });

  it("moves a trailing exam year into EXAMTAG", () => {
    const formatted = formatMarkdown("Q2. Find the value. (JEE Main 2019)");

    expect(formatted).toBe("2. [EXAMTAG: JEE Main 2019] Find the value.");
  });

  it("removes an exam year duplicated after an existing tag", () => {
    const formatted = formatMarkdown("3. [EXAMTAG: NEET 2021] NEET 2021: Find the answer.");

    expect(formatted).toBe("3. [EXAMTAG: NEET 2021] Find the answer.");
  });

  it("does not attach an empty D option to the next question", () => {
    const formatted = formatMarkdown("1. First question\nA\nB\nC\nD\n2. Second question");

    expect(formatted).not.toContain("D. 2. Second question");
    expect(formatted).toContain("D\n\n2. Second question");
  });

  it("still merges a stacked option with its actual content", () => {
    const formatted = formatMarkdown("A.\nChloroplast");

    expect(formatted).toBe("A. Chloroplast");
  });

  it("pulls a newline-split question onto the same line as the question number/examtag", () => {
    const formatted = formatMarkdown("4. [CBSE CLASS 10 2018]\nWhat were the main differences?");
    expect(formatted).toBe("4. [EXAMTAG: CBSE CLASS 10 2018] What were the main differences?");
  });

  it("does not pull subsequent options onto the same line as the tag", () => {
    const formatted = formatMarkdown("4. [CBSE CLASS 10 2018]\nA. Option A");
    expect(formatted).toContain("4. [EXAMTAG: CBSE CLASS 10 2018] \n\nA. Option A");
  });
});

