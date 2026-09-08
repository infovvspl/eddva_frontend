// PageHead.jsx — New Website Mockup
// Compact banner at the top of a sub-page: breadcrumb back to the one-pager,
// then the page title and a one-line standfirst. Shared by the sub-pages so
// they all open the same way.
//
// `icon`/`color`/`bg` and `stats` are optional — plain pages (About, Contact,
// FAQ, Features) pass none of them and render exactly as before. The
// dedicated Solution pages pass all four to tie the banner's colour to the
// role/audience accent and surface a couple of real numbers (capability
// count, focus-area count) pulled straight from that page's own data, so the
// banner carries information instead of just a title.
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const PageHead = ({ title, accent, lead, id, icon: Icon, color, bg, stats }) => (
  <section
    className="nw-pagehead"
    id={id}
    style={color ? { "--nw-ph-accent": color, "--nw-ph-bg": bg } : undefined}
  >
    <div className="nw-pagehead__container">
      <nav className="nw-pagehead__crumbs" aria-label="Breadcrumb">
        <Link to="/" className="nw-pagehead__crumb">Home</Link>
        <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
        <span className="nw-pagehead__crumb nw-pagehead__crumb--current" aria-current="page">
          {title} {accent}
        </span>
      </nav>

      {Icon && (
        <span className="nw-pagehead__icon" aria-hidden="true">
          <Icon size={28} strokeWidth={1.8} />
        </span>
      )}

      <h1 className="nw-pagehead__title">
        {title} <span className="nw-pagehead__title-accent">{accent}</span>
      </h1>

      {lead && <p className="nw-pagehead__lead">{lead}</p>}

      {stats && stats.length > 0 && (
        <div className="nw-pagehead__stats">
          {stats.map(stat => (
            <div className="nw-pagehead__stat" key={stat.label}>
              <span className="nw-pagehead__stat-value">{stat.value}</span>
              <span className="nw-pagehead__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);

export default PageHead;
