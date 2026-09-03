// ProductsPage.jsx — route: /products
// Hero, "Explore Our Product Suite" as five self-contained cards, the
// "Why Choose EDDVA" grid, then the closing CTA band.
//
// The suite was a capability comparison matrix — five products as columns,
// two dozen capabilities as rows. It asked a visitor to cross-reference cells
// to work out what each product did, which read as confusing rather than
// clarifying. Each card here stands alone instead: no column to check against.
//
// CtaBanner is the home page's band, reused here because the page ends on
// exactly it. Everything above it is built for this page.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import ProductsHero from "../components/ProductsHero";
import ProductGrid from "../components/ProductGrid";
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
        <ProductGrid />
        <WhyChooseGrid />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
