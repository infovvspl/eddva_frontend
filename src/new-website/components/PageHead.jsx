// PageHead.jsx — New Website Mockup
// Compact banner at the top of a sub-page: breadcrumb back to the one-pager,
// then the page title and a one-line standfirst. Shared by Pricing and Contact
// so both sub-pages open the same way.

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const PageHead = ({ title, accent, lead, id }) => (
  <section className="nw-pagehead" id={id}>
    <div className="nw-pagehead__container">
      <nav className="nw-pagehead__crumbs" aria-label="Breadcrumb">
        <Link to="/" className="nw-pagehead__crumb">Home</Link>
        <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
        <span className="nw-pagehead__crumb nw-pagehead__crumb--current" aria-current="page">
          {title} {accent}
        </span>
      </nav>

      <h1 className="nw-pagehead__title">
        {title} <span className="nw-pagehead__title-accent">{accent}</span>
      </h1>

      {lead && <p className="nw-pagehead__lead">{lead}</p>}
    </div>
  </section>
);

export default PageHead;
