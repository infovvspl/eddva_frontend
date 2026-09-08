// Navbar.jsx — New Website Mockup
// Home · About · Product · Solution · FAQ · Contact us + Login
// A link may declare `children` to render a hover dropdown; none do by default.
//
// Bar pins to the top once scrolled past its natural position, so the nav
// stays reachable on long pages. Plain CSS `position: sticky` does not work
// here — `#root`/`body` in the app's global index.css carry `overflow-x:
// hidden`, which per spec forces their `overflow-y` to compute as `auto`,
// making `#root` (which never itself scrolls — the real scrolling happens on
// `html`) the nearest ancestor scroll container `sticky` binds to instead of
// the viewport. Rather than touch that global, app-wide reset, pinning is
// done by hand: a zero-height sentinel sits right where the bar naturally
// starts (after TopBar); once it scrolls past the viewport top the bar
// switches to `position: fixed` and a spacer of its own height opens up in
// flow so content below does not jump.
//
// Register was removed from the CTA slot; Login is now the sole action,
// promoted to the filled pill style so the bar keeps one clear primary
// action instead of reading as unbalanced with only an outline button left.
// The Features hub link was removed too — individual feature pages
// (/features/:slug) still exist and are reachable from the home page's AI
// Features marquee, just not from this bar.
//
// A link is either an in-page anchor on the one-pager (`href`) or its own
// route (`to`). Since this bar is also mounted on the sub-pages, where an
// anchor has nothing to scroll to, anchors are rewritten there as links back
// to the one-pager carrying the hash — see NavItemLink.
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogIn } from "lucide-react";
import { LOGO, LOGO_ALT } from "../brand";

const HOME_PATH = "/";

// A dropdown child always uses a full "/page#anchor-id" path, never a bare
// "#anchor-id" — the nav is mounted on every page, so a bare hash would only
// work while already sitting on /solution. Anchor ids are the real section
// ids from SolutionAudience/SolutionRoles.
const links = [
  { id: "home",     label: "Home",       href: "#nw-home" },
  { id: "about",    label: "About",      to: "/about" },
  { id: "product",  label: "Product",    to: "/products" },
  {
    id: "solution", label: "Solution",   to: "/solution",
    children: [
      { id: "institutions", label: "For Institutions", to: "/solution/institutions" },
      { id: "teachers",     label: "For Teachers",     to: "/solution/teachers" },
      { id: "students",     label: "For Students",     to: "/solution/students" },
      { id: "parents",      label: "For Parents",      to: "/solution/parents" },
    ],
  },
  { id: "faq",      label: "FAQ",        to: "/faq" },
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
  const [pinned, setPinned] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const sentinelRef = useRef(null);
  const navRef = useRef(null);

  // Compact the bar once the page is scrolled past the hero fold
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pins the bar once the sentinel (sitting right where the bar naturally
  // starts) scrolls past the viewport top — see the file header comment for
  // why this replaces plain `position: sticky`.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Measures the bar's own height for the spacer that opens up once pinned.
  // Re-measured on resize since the compact/mobile layouts differ in height.
  useEffect(() => {
    const measure = () => { if (navRef.current) setNavHeight(navRef.current.offsetHeight); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [menuOpen]);

  return (
    <>
      <span ref={sentinelRef} aria-hidden="true" style={{ display: "block", height: 0 }} />
      <header
        ref={navRef}
        className={`nw-navbar${scrolled ? " nw-navbar--scrolled" : ""}${pinned ? " nw-navbar--pinned" : ""}`}
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
                    <Link
                      key={child.id}
                      to={child.to}
                      className="nw-navbar__dropdown-link"
                      id={`nw-dropdown-${link.id}-${child.id}`}
                      onClick={() => { setActive(link.id); setOpenDropdown(null); }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* ── CTA Buttons ── */}
        <div className="nw-navbar__actions">
          <Link to="/login" className="nw-btn nw-btn--pill" id="nw-btn-login">
            <LogIn size={16} strokeWidth={2.2} />
            Login
          </Link>
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
                  <Link
                    key={child.id}
                    to={child.to}
                    className="nw-navbar__mobile-sublink"
                    id={`nw-mob-${link.id}-${child.id}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="nw-navbar__mobile-actions">
          <Link to="/login" className="nw-btn nw-btn--pill" id="nw-mob-login"
                onClick={() => setMenuOpen(false)}>
            <LogIn size={16} strokeWidth={2.2} />
            Login
          </Link>
        </div>
      </div>
      </header>
      {pinned && <div className="nw-navbar__spacer" style={{ height: navHeight }} aria-hidden="true" />}
    </>
  );
};

export default Navbar;
