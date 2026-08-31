// ProductsPage.jsx — route: /new-website/products
// Sub-page of the new website mockup. Shares only the chrome with the other
// surfaces; the product rows and the AI feature list are built for this page.
// Same copy as the home page (src/new-website/data), different presentation.
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import ProductsMatrix from "../components/ProductsMatrix";
import AiFeatureChecklist from "../components/AiFeatureChecklist";
import Footer from "../components/Footer";

const ProductsPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-products-head"
          title="Our"
          accent="Products"
          lead="A learning management system, a full ERP and analytics — working as one."
        />
        <ProductsMatrix />
        <AiFeatureChecklist />
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
