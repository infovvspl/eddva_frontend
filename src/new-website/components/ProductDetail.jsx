// ProductDetail.jsx — /products/:slug
// One product's own page: overview, what it does, then — for EDDVA ERP and
// EDDVA AI Learn only — the full module accordion that used to sit directly
// on /products underneath the five-card grid. It moved here so the hub page
// carries just the grid, not all five products' full depth at once; the
// other three products (EDDVA Plus, EDDVA JEE NEET AI, EDDVA JEE NEET) have
// no separate module dataset, so their page is the overview alone.
//
// Rendered for whichever product the route resolved; the page component
// handles an unknown slug before this ever mounts. Titles are unchanged from
// data/products.js — this is a layout change, not a rename.

import { Link } from "react-router-dom";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { products } from "../data/products";
import ErpModules from "./ErpModules";
import LmsModules from "./LmsModules";
import useInView from "../hooks/useInView";

const MODULE_BLOCK = {
  "nw-prod-erp": ErpModules,
  "nw-prod-lms": LmsModules,
};

const ProductDetail = ({ product }) => {
  const { id, slug, title, tagline, desc, bullets, cta, img, Icon, color, bg } = product;
  const [ref, inView] = useInView({ threshold: 0.08 });
  const ModuleBlock = MODULE_BLOCK[id];

  const related = products.filter(p => p.id !== id).slice(0, 3);

  return (
    <div className="nw-proddet" style={{ "--nw-pd-accent": color, "--nw-pd-bg": bg }}>
      {/* ── Overview ── */}
      <section className="nw-proddet__hero" id={`nw-product-${slug}`}>
        <div className="nw-proddet__hero-inner">
          <div className="nw-proddet__hero-copy">
            <Link to="/products" className="nw-proddet__back">
              <ArrowLeft size={15} strokeWidth={2.4} />
              All products
            </Link>
            <h1 className="nw-proddet__title" style={{ whiteSpace: "pre-line" }}>{title}</h1>
            <p className="nw-proddet__tagline">{tagline}</p>
            <p className="nw-proddet__intro">{desc}</p>
          </div>

          <div className="nw-proddet__hero-art" aria-hidden="true">
            <span className="nw-proddet__halo" />
            {img ? (
              <img src={img} alt="" className="nw-proddet__img" />
            ) : (
              <Icon size={120} strokeWidth={1.2} className="nw-proddet__icon-art" />
            )}
          </div>
        </div>
      </section>

      {/* ── What it does ── */}
      <section className="nw-proddet__body">
        <div className={`nw-proddet__body-inner${inView ? " nw-in" : ""}`} ref={ref}>
          <h2 className="nw-proddet__h2">What it does</h2>
          <ul className="nw-proddet__points">
            {bullets.map((point, i) => (
              <li className="nw-proddet__point" key={point} style={{ "--i": i }}>
                <span className="nw-proddet__tick" aria-hidden="true">
                  <Check size={13} strokeWidth={3.2} />
                </span>
                {point}
              </li>
            ))}
          </ul>

          <div className="nw-proddet__cta-card">
            <div>
              <h3 className="nw-proddet__cta-title">See {title} in your institution</h3>
              <p className="nw-proddet__cta-desc">
                We will walk you through it on your own setup.
              </p>
            </div>
            <Link to="/contact" className="nw-proddet__cta" id={`nw-product-${slug}-cta`}>
              {cta}
              <ArrowRight size={15} strokeWidth={2.6} />
            </Link>
          </div>
        </div>
      </section>

      {ModuleBlock && <ModuleBlock />}

      {/* ── Related ── */}
      <section className="nw-proddet__related">
        <div className="nw-proddet__related-inner">
          <h2 className="nw-proddet__h2">More products</h2>
          <div className="nw-proddet__related-grid">
            {related.map(item => (
              <Link
                to={`/products/${item.slug}`}
                className="nw-proddet__related-card"
                key={item.id}
                style={{ "--nw-pd-accent": item.color, "--nw-pd-bg": item.bg }}
              >
                <span className="nw-proddet__related-thumb">
                  {item.img ? (
                    <img src={item.img} alt="" loading="lazy" />
                  ) : (
                    <item.Icon size={22} strokeWidth={1.6} />
                  )}
                </span>
                <span className="nw-proddet__related-copy">
                  <span className="nw-proddet__related-title" style={{ whiteSpace: "pre-line" }}>
                    {item.title}
                  </span>
                  <span className="nw-proddet__related-tagline">{item.tagline}</span>
                </span>
                <ArrowRight size={16} strokeWidth={2.4} className="nw-proddet__related-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
