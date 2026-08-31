// ProductsMatrix.jsx — /new-website/products
// The five products as alternating full-width rows — artwork one side, copy the
// other, sides flipping down the page. Deliberately NOT the home page's card
// grid. Copy and artwork come from data/products.js.
//
// `title` carries a newline for the two JEE / NEET entries, so it is rendered
// with `white-space: pre-line` exactly as the home page does.

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { products } from "../data/products";

const ProductsMatrix = () => {
  return (
    <section className="nw-matrix" id="nw-products-matrix">
      <div className="nw-matrix__container">

        <h2 className="nw-matrix__heading">Complete Solutions for Every Need</h2>

        <div className="nw-matrix__rows">
          {products.map(({ id, title, desc, img, Icon, color, bg, border, btn }, i) => (
            <article
              className={`nw-matrix__row${i % 2 ? " nw-matrix__row--flip" : ""}`}
              key={id}
              id={`${id}-row`}
              style={{
                "--nw-matrix-accent": color,
                "--nw-matrix-bg": bg,
                "--nw-matrix-border": border,
                "--nw-matrix-btn": btn,
              }}
            >
              <div className="nw-matrix__art" aria-hidden="true">
                {img ? (
                  <img src={img} alt="" className="nw-matrix__img" loading="lazy" />
                ) : (
                  <span className="nw-matrix__fallback">
                    <Icon size={54} strokeWidth={1.4} />
                  </span>
                )}
              </div>

              <div className="nw-matrix__copy">
                <span className="nw-matrix__index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="nw-matrix__title" style={{ whiteSpace: "pre-line" }}>
                  {title}
                </h3>
                <p className="nw-matrix__desc">{desc}</p>
                <Link to="/new-website/contact" className="nw-matrix__cta" id={`${id}-cta`}>
                  Talk to us
                  <ArrowRight size={15} strokeWidth={2.4} />
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProductsMatrix;
