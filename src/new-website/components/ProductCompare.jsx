// ProductCompare.jsx — /products
// "Explore Our Product Suite" as a comparison matrix: the five products as
// columns, capabilities as rows, so a buyer can see what separates them
// without reading five panels.
//
// A real <table> rather than a grid of divs, so screen readers announce each
// cell against its row and column. Ticks and dashes carry a visually-hidden
// "Included" / "Not included" so a cell never reads as an empty box.
//
// The header row sticks under the navbar while you scroll the matrix, and the
// first column sticks to the left edge once the table starts scrolling
// sideways on narrow screens.
//
// Column order comes from data/products.js; the matrix from data/comparison.js
// — where the ticks are flagged as inferred and awaiting sign-off.

import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, ArrowRight, Sparkles } from "lucide-react";
import { products } from "../data/products";
import { cols, groups } from "../data/comparison";
import useInView from "../hooks/useInView";

const FEATURED = "nw-prod-combo";

const ProductCompare = () => {
  const [hovered, setHovered] = useState(null);
  const [ref, inView] = useInView({ threshold: 0.05 });

  // Ordered to match `cols`, so a reordered data file cannot desync the table
  const ordered = cols.map(id => products.find(p => p.id === id)).filter(Boolean);

  const colClass = i =>
    `nw-cmp__col${hovered === i ? " nw-hot" : ""}${ordered[i].id === FEATURED ? " nw-featured" : ""}`;

  return (
    <section className="nw-cmp" id="nw-product-suite">
      <div className="nw-cmp__container">

        <header className="nw-cmp__header">
          <h2 className="nw-cmp__heading">
            Explore Our <span className="nw-cmp__heading-accent">Product</span> Suite
          </h2>
          <p className="nw-cmp__lead">
            Everything you need to run and grow a modern educational institution.
          </p>
        </header>

        <div className={`nw-cmp__scroll${inView ? " nw-in" : ""}`} ref={ref}>
          <table className="nw-cmp__table">
            <caption className="nw-sr-only">
              Capabilities included in each EDDVA product
            </caption>

            <thead>
              <tr>
                <th scope="col" className="nw-cmp__corner">Capability</th>
                {ordered.map((product, i) => (
                  <th
                    scope="col"
                    key={product.id}
                    id={`${product.id}-col`}
                    className={colClass(i)}
                    style={{ "--nw-cmp-accent": product.color, "--nw-cmp-bg": product.bg, "--i": i }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {product.id === FEATURED && (
                      <span className="nw-cmp__flag">
                        <Sparkles size={11} strokeWidth={2.4} />
                        Most Popular
                      </span>
                    )}
                    <span className="nw-cmp__tile" aria-hidden="true">
                      <product.TileIcon size={19} strokeWidth={2} />
                    </span>
                    <span className="nw-cmp__name" style={{ whiteSpace: "pre-line" }}>
                      {product.title}
                    </span>
                    <span className="nw-cmp__tagline">{product.tagline}</span>
                  </th>
                ))}
              </tr>
            </thead>

            {groups.map(group => (
              <tbody key={group.id} className="nw-cmp__group">
                <tr className="nw-cmp__group-row">
                  <th scope="colgroup" colSpan={ordered.length + 1} className="nw-cmp__group-label">
                    {group.label}
                  </th>
                </tr>
                {group.rows.map(row => (
                  <tr key={row.id} id={`cmp-${row.id}`} className="nw-cmp__row">
                    <th scope="row" className="nw-cmp__rowhead">{row.label}</th>
                    {row.has.map((included, i) => (
                      <td
                        key={cols[i]}
                        className={`${colClass(i)} nw-cmp__cell`}
                        style={{ "--nw-cmp-accent": ordered[i].color, "--nw-cmp-bg": ordered[i].bg }}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {included ? (
                          <span className="nw-cmp__yes">
                            <Check size={13} strokeWidth={3.2} aria-hidden="true" />
                            <span className="nw-sr-only">Included</span>
                          </span>
                        ) : (
                          <span className="nw-cmp__no">
                            <Minus size={13} strokeWidth={2.6} aria-hidden="true" />
                            <span className="nw-sr-only">Not included</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}

            <tfoot>
              <tr>
                <td className="nw-cmp__corner nw-cmp__corner--foot" />
                {ordered.map((product, i) => (
                  <td
                    key={product.id}
                    className={`${colClass(i)} nw-cmp__cell`}
                    style={{ "--nw-cmp-accent": product.color, "--nw-cmp-btn": product.btn }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <Link
                      to="/contact"
                      className="nw-cmp__cta"
                      id={`${product.id}-cta`}
                    >
                      {product.cta}
                      <ArrowRight size={14} strokeWidth={2.6} />
                    </Link>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="nw-cmp__hint">Scroll the table sideways to compare every product.</p>

      </div>
    </section>
  );
};

export default ProductCompare;
