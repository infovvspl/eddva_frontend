// PricingPage.jsx — route: /pricing
// Sub-page of the new website mockup. Reuses the one-pager's chrome (TopBar,
// Navbar, Footer) so the two surfaces stay identical, and reinstates
// FaqSection here — it holds signed-off EDDVA copy and is not mounted on the
// main page, so pricing questions land somewhere useful, and nothing on this
// page repeats a home page section.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import PricingSection from "../components/PricingSection";
import FaqSection from "../components/FaqSection";
import Footer from "../components/Footer";

const PricingPage = () => {
  // Arriving from the navbar should start at the top, not mid-scroll
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-pricing-head"
          title="Simple, Transparent"
          accent="Pricing"
          lead="One platform, priced to the size of your institution."
        />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
