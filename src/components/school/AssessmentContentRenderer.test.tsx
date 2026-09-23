/**
 * Chapter figures in the assessment paper view.
 *
 * prepareAssessmentText is a stack of heuristics written for exam prose, and
 * every one of them is hostile to a URL: the bare-underscore rule inserts a
 * backslash inside the path, the "[p. 12]" citation cleanup eats bracketed alt
 * text, and the LaTeX auto-wrapping treats a backslash or a digit-caret in a
 * filename as maths. Figures are therefore masked out before those passes and
 * restored afterwards, and these tests pin that the URL survives byte for byte.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AssessmentContentRenderer from "./AssessmentContentRenderer";

const URL_WITH_UNDERSCORES =
  "https://media.example/tenants/t1/textbook_figures/ch_1/p8_0.png";

function renderPaper(markdown: string) {
  return render(<AssessmentContentRenderer>{markdown}</AssessmentContentRenderer>);
}

describe("AssessmentContentRenderer — figures", () => {
  it("renders a Markdown image as an <img>", () => {
    renderPaper("1. Study the diagram.\n\n![Fig. 10.13 Transverse Wave](https://media.example/a.png)");
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "https://media.example/a.png");
    expect(image).toHaveAttribute("alt", "Fig. 10.13 Transverse Wave");
  });

  it("does not corrupt a URL containing underscores", () => {
    // The bare-underscore escape would otherwise insert a backslash into the
    // path and break the link.
    renderPaper(`1. Study it.\n\n![Fig. 1](${URL_WITH_UNDERSCORES})`);
    expect(screen.getByRole("img")).toHaveAttribute("src", URL_WITH_UNDERSCORES);
  });

  it("constrains the figure so a wide crop cannot scroll the paper sideways", () => {
    renderPaper("1. q\n\n![Fig. 1](https://media.example/a.png)");
    expect(screen.getByRole("img").className).toContain("max-w-full");
  });

  it("gives an unlabelled figure a fallback alt rather than none", () => {
    renderPaper("1. q\n\n![](https://media.example/a.png)");
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Figure");
  });

  it("renders several figures in one paper", () => {
    renderPaper(
      "1. First.\n\n![Fig. 1](https://media.example/a.png)\n\n" +
      "2. Second.\n\n![Fig. 2](https://media.example/b.png)",
    );
    const images = screen.getAllByRole("img");
    expect(images.map((i) => i.getAttribute("src"))).toEqual([
      "https://media.example/a.png",
      "https://media.example/b.png",
    ]);
  });

  it("still renders the question text around the figure", () => {
    renderPaper("1. Study the wave shown below.\n\n![Fig. 1](https://media.example/a.png)");
    expect(screen.getByText(/Study the wave shown below/)).toBeInTheDocument();
  });

  it("leaves a figure-free paper rendering exactly as before", () => {
    renderPaper("## Section A\n\n1. What is sound?\n\n2. Define frequency.");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText(/What is sound\?/)).toBeInTheDocument();
    expect(screen.getByText(/Define frequency\./)).toBeInTheDocument();
  });

  it("still renders maths alongside a figure", () => {
    // The image masking must not disturb the KaTeX passes it sits between.
    const { container } = renderPaper(
      "1. Given $v = f\\lambda$, find v.\n\n![Fig. 1](https://media.example/a.png)",
    );
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("does not leave the internal placeholder visible", () => {
    const { container } = renderPaper("1. q\n\n![Fig. 1](https://media.example/a.png)");
    expect(container.textContent).not.toContain("IMGTOKEN");
    expect(container.textContent).not.toContain("ENDIMG");
  });
});
