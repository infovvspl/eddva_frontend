// ProductGrid.jsx — /products
// "Explore Our Product Suite" as five self-contained cards, replacing the
// capability comparison matrix that was here before.
//
// The matrix asked a visitor to cross-reference rows against five columns to
// work out what each product actually did — useful for someone already
// comparing, confusing for someone landing on the page cold. Each card here
// stands on its own: icon, name, tagline, description, its own top
// capabilities, one CTA. Nothing to reconcile against a neighbouring column.
//
// Same fields as before (`bullets`, `tagline`, `TileIcon`, `cta`) — this is a
// presentation change only, no new copy.

import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { products } from "../data/products";
import useInView from "../hooks/useInView";

const FEATURED = "nw-prod-combo";

const ProductCard = ({ product, index }) => {
  const { id, title, desc, tagline, bullets, cta, TileIcon, img, Icon, color, bg, border, btn } = product;
  const [ref, inView] = useInView({ threshold: 0.15 });
  const featured = id === FEATURED;

  return (
    <article
      ref={ref}
      id={`${id}-card`}
      className={`nw-pgrid__card${featured ? " nw-featured" : ""}${inView ? " nw-in" : ""}`}
      style={{
        "--i": index,
        "--nw-pg-accent": color,
        "--nw-pg-bg": bg,
        "--nw-pg-border": border,
        "--nw-pg-btn": btn,
      }}
    >
      {featured && (
        <span className="nw-pgrid__flag">
          <Sparkles size={11} strokeWidth={2.4} />
          Most Popular
        </span>
      )}

      <div className="nw-pgrid__head">
        <span className="nw-pgrid__art" aria-hidden="true">
          {img ? (
            <img src={img} alt="" className="nw-pgrid__img" loading="lazy" />
          ) : (
            <Icon size={44} strokeWidth={1.4} />
          )}
        </span>
        <span className="nw-pgrid__tile" aria-hidden="true">
          <TileIcon size={17} strokeWidth={2.1} />
        </span>
      </div>

      <h3 className="nw-pgrid__title" style={{ whiteSpace: "pre-line" }}>{title}</h3>
      <p className="nw-pgrid__tagline">{tagline}</p>
      <p className="nw-pgrid__desc">{desc}</p>

      <ul className="nw-pgrid__bullets">
        {bullets.map(bullet => (
          <li className="nw-pgrid__bullet" key={bullet}>
            <span className="nw-pgrid__tick" aria-hidden="true">
              <Check size={11} strokeWidth={3.2} />
            </span>
            {bullet}
          </li>
        ))}
      </ul>

      <Link
        to="/contact"
        className={`nw-pgrid__cta${featured ? " nw-pgrid__cta--filled" : ""}`}
        id={`${id}-cta`}
      >
        {cta}
        <ArrowRight size={14} strokeWidth={2.6} />
      </Link>
    </article>
  );
};

const ProductGrid = () => {
  return (
    <section className="nw-pgrid" id="nw-product-suite">
      <div className="nw-pgrid__container">

        <header className="nw-pgrid__header">
          <h2 className="nw-pgrid__heading">
            Explore Our <span className="nw-pgrid__heading-accent">Product</span> Suite
          </h2>
          <p className="nw-pgrid__lead">
            Five products, one platform. Pick what your institution needs —
            everything below is included in what it says.
          </p>
        </header>

        <div className="nw-pgrid__grid">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProductGrid;
