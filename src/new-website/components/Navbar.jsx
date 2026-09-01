// Navbar.jsx — New Website Mockup
// Home · About · Product · Solution · Pricing · Contact us + Login / Register
// A link may declare `children` to render a hover dropdown; none do by default.
//
// A link is either an in-page anchor on the one-pager (`href`) or its own
// route (`to`). Since this bar is also mounted on the sub-pages, where an
// anchor has nothing to scroll to, anchors are rewritten there as links back
// to the one-pager carrying the hash — see NavItemLink.
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { LOGO, LOGO_ALT } from "../brand";

const HOME_PATH = "/";

const links = [
  { id: "home",     label: "Home",       href: "#nw-home" },
  { id: "about",    label: "About",      to: "/about" },
  { id: "product",  label: "Product",    to: "/products" },
  { id: "solution", label: "Solution",   to: "/solution" },
  { id: "pricing",  label: "Pricing",    to: "/pricing" },
  { id: "contact",  label: "Contact us", to: "/contact" },
];

const NavItemLink = ({ link, onHome, className, id, onClick, children }) => {
  if (link.to || !onHome) {
    return (
      <Link
        to={link.to || `${HOME_PATH}${link.href}`}
        className={className}
        id={id}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  return (
    <a href={link.href} className={className} id={id} onClick={onClick}>
      {children}
    </a>
  );
};

const Navbar = () => {
  const { pathname } = useLocation();
  // In-page anchors only resolve on the one-pager itself; from a sub-page
  // they have to route back to "/" first, carrying the hash.
  const onHome = pathname === HOME_PATH;
  const routeActive = links.find(l => l.to && pathname.startsWith(l.to))?.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  // On the one-pager the active item follows clicks; on a sub-page the route
  // decides it, and nothing is highlighted on an unrelated route.
  const current = onHome ? active : routeActive;
  const [openDropdown, setOpenDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Compact the bar once the page is scrolled past the hero fold
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`nw-navbar${scrolled ? " nw-navbar--scrolled" : ""}`}
      id="nw-navbar"
    >
      <div className="nw-navbar__container">

        {/* ── Logo ── */}
        <a href="#nw-home" className="nw-navbar__logo" id="nw-nav-logo">
          <img
            src={LOGO}
            alt={LOGO_ALT}
            className="nw-navbar__logo-img"
            id="nw-logo-img"
          />
        </a>

        {/* ── Desktop nav links ── */}
        <nav className="nw-navbar__nav" id="nw-main-nav" aria-label="Main Navigation">
          {links.map(link => (
            <div
              key={link.id}
              className="nw-navbar__item"
              onMouseEnter={() => setOpenDropdown(link.children ? link.id : null)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <NavItemLink
                link={link}
                onHome={onHome}
                id={`nw-nav-${link.id}`}
                className={`nw-navbar__link${current === link.id ? " nw-navbar__link--active" : ""}`}
                onClick={() => setActive(link.id)}
              >
                {link.label}
                {link.children && (
                  <ChevronDown
                    size={14}
                    strokeWidth={2.4}
                    className={`nw-navbar__caret${openDropdown === link.id ? " nw-navbar__caret--open" : ""}`}
                  />
                )}
              </NavItemLink>

              {link.children && (
                <div
                  className={`nw-navbar__dropdown${openDropdown === link.id ? " nw-open" : ""}`}
                  id={`nw-dropdown-${link.id}`}
                >
                  {link.children.map(child => (
                    <a
                      key={child.id}
                      href={child.href}
                      className="nw-navbar__dropdown-link"
                      id={`nw-dropdown-${link.id}-${child.id}`}
                      onClick={() => { setActive(link.id); setOpenDropdown(null); }}
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* ── CTA Buttons ── */}
        <div className="nw-navbar__actions">
          <a href="#nw-login"    className="nw-btn nw-btn--pill-outline" id="nw-btn-login">Login</a>
          <a href="#nw-register" className="nw-btn nw-btn--pill"         id="nw-btn-register">Register</a>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="nw-navbar__hamburger"
          id="nw-hamburger-btn"
          aria-label="Open Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      <div className={`nw-navbar__mobile${menuOpen ? " nw-open" : ""}`} id="nw-mobile-menu">
        {links.map(link => (
          <div key={link.id}>
            <NavItemLink
              link={link}
              onHome={onHome}
              id={`nw-mob-${link.id}`}
              className={`nw-navbar__mobile-link${current === link.id ? " nw-navbar__link--active" : ""}`}
              onClick={() => { setActive(link.id); setMenuOpen(false); }}
            >
              {link.label}
            </NavItemLink>
            {link.children && (
              <div className="nw-navbar__mobile-sub">
                {link.children.map(child => (
                  <a
                    key={child.id}
                    href={child.href}
                    className="nw-navbar__mobile-sublink"
                    id={`nw-mob-${link.id}-${child.id}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="nw-navbar__mobile-actions">
          <a href="#nw-login"    className="nw-btn nw-btn--pill-outline" id="nw-mob-login">Login</a>
          <a href="#nw-register" className="nw-btn nw-btn--pill"         id="nw-mob-register">Register</a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
