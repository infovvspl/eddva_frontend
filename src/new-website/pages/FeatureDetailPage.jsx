// FeatureDetailPage.jsx — route: /features/:slug
// One page per AI feature. The nine pages share this component rather than
// existing as nine near-identical files; each still has its own URL, and a new
// feature in data/features.js gets a page without any routing change.
//
// An unrecognised slug redirects to the index rather than rendering an empty
// shell — a typo in a shared link should land somewhere useful.

import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import FeatureDetail from "../components/FeatureDetail";
import Footer from "../components/Footer";
import { findFeature } from "../data/features";

const FeatureDetailPage = () => {
  const { slug } = useParams();
  const feature = findFeature(slug);

  // Re-runs on slug change, so moving between features starts at the top
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!feature) return <Navigate to="/features" replace />;

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <FeatureDetail feature={feature} />
      </main>
      <Footer />
    </div>
  );
};

export default FeatureDetailPage;
