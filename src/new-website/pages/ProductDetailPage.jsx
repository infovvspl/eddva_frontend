// ProductDetailPage.jsx — route: /products/:slug
// One page per product. The five products share this component rather than
// existing as five near-identical files; each still has its own URL, and a
// new product in data/products.js gets a page without any routing change.
//
// An unrecognised slug redirects to the index rather than rendering an empty
// shell — a typo in a shared link should land somewhere useful.

import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import ProductDetail from "../components/ProductDetail";
import Footer from "../components/Footer";
import { findProduct } from "../data/products";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const product = findProduct(slug);

  // Re-runs on slug change, so moving between products starts at the top
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!product) return <Navigate to="/products" replace />;

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <ProductDetail product={product} />
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
