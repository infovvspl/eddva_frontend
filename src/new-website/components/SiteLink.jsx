// SiteLink.jsx — New Website Mockup
// One link component for chrome that is mounted on every surface.
//
// A destination is either a route (`to`) or an in-page anchor on the one-pager
// (`href="#nw-…"`). An anchor only works while you are actually on the
// one-pager, so from a sub-page it is rewritten as a router link back to
// /new-website carrying the hash.

import { Link, useLocation } from "react-router-dom";

export const HOME_PATH = "/new-website";

const SiteLink = ({ to, href, className, id, children, ...rest }) => {
  const { pathname } = useLocation();
  const onHome = pathname === HOME_PATH || pathname === `${HOME_PATH}/`;

  if (to) {
    return <Link to={to} className={className} id={id} {...rest}>{children}</Link>;
  }
  // External links and non-page protocols (tel:, mailto:) pass straight through
  if (href && !href.startsWith("#")) {
    return <a href={href} className={className} id={id} {...rest}>{children}</a>;
  }
  if (!onHome) {
    return (
      <Link to={`${HOME_PATH}${href}`} className={className} id={id} {...rest}>
        {children}
      </Link>
    );
  }
  return <a href={href} className={className} id={id} {...rest}>{children}</a>;
};

export default SiteLink;
