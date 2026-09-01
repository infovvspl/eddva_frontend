// ProductsPage.jsx — route: /products
// Built to the supplied mockup: hero, "Explore Our Product Suite", the
// "Why Choose EDDVA" grid, then the closing CTA band.
//
// The suite is a capability comparison matrix rather than the mockup's
// alternating panels — five products side by side, so the differences
// between them are readable at a glance.
//
// CtaBanner is the home page's band, reused here because the mockup ends on
// exactly it. Everything above it is built for this page.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import ProductsHero from "../components/ProductsHero";
import ProductCompare from "../components/ProductCompare";
import WhyChooseGrid from "../components/WhyChooseGrid";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";

const ProductsPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <ProductsHero />
        <ProductCompare />
        <WhyChooseGrid />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
