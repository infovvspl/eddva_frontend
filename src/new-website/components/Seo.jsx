// Seo.jsx — per-route <title>/<meta name="description">/<link rel="canonical">.
// Before this, every new-website route served index.html's one static title
// and description (a JEE/NEET-only blurb) regardless of which page a crawler
// or share preview actually hit. Drop this once near the top of a page.

import { Helmet } from "react-helmet-async";

const SITE_URL = "https://eddva.in";

const Seo = ({ title, description, path }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {path && <link rel="canonical" href={`${SITE_URL}${path}`} />}
  </Helmet>
);

export default Seo;
