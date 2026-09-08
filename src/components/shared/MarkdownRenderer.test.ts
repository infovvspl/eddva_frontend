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

  it("wraps a bare LaTeX fraction embedded in prose", () => {
    const formatted = formatMarkdown("The value of \\frac{sin 30°}{cos 60°} is");

    expect(formatted).toContain("$\\frac{sin 30°}{cos 60°}$");
  });

  it("wraps arbitrary structured LaTeX commands without a command allowlist", () => {
    const formatted = formatMarkdown("Use \\binom{n}{r} and vector \\vec{\\mathbf{F}} here");

    expect(formatted).toContain("$\\binom{n}{r}$");
    expect(formatted).toContain("$\\vec{\\mathbf{F}}$");
  });

  it("keeps malformed unit equations as one renderable math expression", () => {
    const formatted = formatMarkdown("S = k \\ * P = 0.1 mol atm / mol * 1 atm = 0.1 mol");

    // "atm / mol" is a unit ratio, not a math fraction — it must stay as plain text rather than
    // becoming \frac{atm}{mol}, which is exactly the mangled-glyph bug the unit exclusion list
    // (MarkdownRenderer.tsx's applyFractionConversions) exists to prevent for ratios like kg/mol.
    expect(formatted).toContain("$S = k \\cdot P = 0.1 mol atm / mol \\cdot 1 atm = 0.1 mol$");
    expect(formatted).not.toContain("\\frac{atm}{mol}");
    expect(formatted).not.toContain("$=$");
  });

  // This whole block guards one recurring bug CLASS, not a single instance: a heuristic that
  // scans for un-delimited math to wrap in new "$...$" would instead land on content already
  // inside a multi-line "\[...\]" → "$$\ncontent\n$$" block (whose delimiters sit on their own
  // lines, so the content line has no "$" of its own to signal "already protected") and wrap it
  // AGAIN, nesting a stray "$...$" inside the "$$...$$" — which either makes remark-math refuse to
  // render the paragraph as math at all (odd/mismatched "$" count) or leaves literal "$" characters
  // visible at the nesting boundary once rendered. Every case below reproduces a real bug found and
  // fixed this way (normalizeMathLine, wrapFullEquationLines, wrapStructuredLatex,
  // wrapCompoundLatexExpressions, applyFractionConversions, the chemical-equation auto-wrapper).
  // If a future change to MarkdownRenderer.tsx reintroduces a heuristic with its own hand-rolled
  // "am I already inside $" check instead of routing through splitMathProse/mapOutsideMath/
  // mapProseLines, one or more of these will fail.
  describe("multi-line $$ block does not get double-wrapped (regression battery)", () => {
    const assertNoNestedDollar = (out: string) => {
      out.split("\n").forEach((line, i) => {
        const count = (line.match(/\$/g) || []).length;
        expect(count % 2, `line ${i} has an odd $ count: ${JSON.stringify(line)}`).toBe(0);
      });
      expect(out).not.toMatch(/\$\$\s*\$[^$]/);
      expect(out).not.toMatch(/[^$]\$\s*\$\$/);
    };

    const cases: [string, string][] = [
      ["chemical equation with \\rightarrow", "\\[\n2Na + 2H_2O \\rightarrow 2NaOH + H_2\\uparrow\n\\]"],
      ["fraction coefficient (normalizeMathLine target)", "\\[\n2Al + \\frac{3}{2}O_2 \\rightarrow Al_2O_3\n\\]"],
      ["polyatomic ion in parens", "\\[\n4Fe + 3O_2 + 6H_2O \\rightarrow 4Fe(OH)_3\n\\]"],
      ["bare equation with = (wrapFullEquationLines target)", "\\[\nx = \\frac{100}{21},\\qquad y = -\\frac{460}{63}\n\\]"],
      ["system of equations (\\begin{cases})", "\\[\n\\begin{cases}\nx + 2y = 8 \\\\\n3x - y = 7\n\\end{cases}\n\\]"],
      ["structured LaTeX command (wrapStructuredLatex target)", "\\[\n\\frac{\\sin 30}{\\cos 60} = k \\vec{F}\n\\]"],
      ["compound LaTeX with \\rightarrow (wrapCompoundLatexExpressions target)", "\\[\n\\text{Glucose} \\rightarrow \\text{Pyruvate} + \\text{ATP}\n\\]"],
      ["division-shaped fraction (applyFractionConversions target)", "\\[\na/b = c/d\n\\]"],
      ["two separate display blocks in one paragraph", "First \\[a = 1\\] then \\[b = 2\\] done."],
    ];

    for (const [label, input] of cases) {
      it(`stays a single clean block: ${label}`, () => {
        assertNoNestedDollar(formatMarkdown(input));
      });
    }
  });
});
