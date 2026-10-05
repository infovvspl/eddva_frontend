// ProductsSection.jsx — New Website Mockup
// "OUR PRODUCTS — Complete Solutions for Every Need"
//
// Artwork lives in `img`. The last card has no illustration supplied yet, so it
// falls back to `Icon`; drop an "Icon 5.png" beside the others, import it and
// set `img` to switch it over.

import { products } from "../data/products";
import useInView from "../hooks/useInView";


const ProductsSection = () => {
  const [gridRef, gridIn] = useInView({ threshold: 0.12 });

  return (
    <section className="nw-products nw-bg-frame" id="nw-product">
      <div className="nw-products__container">

        {/* Header */}
        <div className="nw-products__header">
          <span className="nw-products__label">OUR PRODUCTS</span>
          <h2 className="nw-products__heading">Complete Solutions for Every Need</h2>
          <span className="nw-products__ornament" aria-hidden="true" />
        </div>

        {/* Cards */}
        <div className={`nw-products__grid${gridIn ? " nw-in" : ""}`} ref={gridRef}>
          {products.map(({ id, title, desc, img, Icon, color, bg, border, btn, btnHover }, i) => (
            <div
              className="nw-products__card"
              key={id}
              id={id}
              style={{ "--nw-accent": color, background: bg, borderColor: border, "--i": i }}
            >
              <div className="nw-products__card-art">
                {img ? (
                  <img src={img} alt="" className="nw-products__card-img" loading="lazy" />
                ) : (
                  <Icon size={62} strokeWidth={1.3} color={color} />
                )}
              </div>
              <h3 className="nw-products__card-title" style={{ whiteSpace: "pre-line", color }}>
                {title}
              </h3>
              <p className="nw-products__card-desc">{desc}</p>
              <a
                href="#nw-demo"
                className="nw-products__card-btn"
                id={`${id}-btn`}
                style={{ "--nw-btn": btn, "--nw-btn-hover": btnHover }}
              >
                View Details
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ProductsSection;
