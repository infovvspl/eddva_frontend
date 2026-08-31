// ServiceGlyphs.jsx — New Website Mockup
// Solid glyphs for the two service cards. Lucide is stroke-only, so the flat
// filled look is drawn here instead; the windows, clock and doorway are knocked
// out with evenodd so the tinted tile shows through them. Both take their
// colour from the tile via currentColor.
//
// Lives in its own file because both ServicesSection (home page) and
// SolutionPanels (/new-website/solution) render them.

export const SchoolGlyph = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.6 0.7h0.8v3.2h-0.8z" />
    <path d="M12.4 0.8h3.9l-1.3 1.4 1.3 1.4h-3.9z" />
    <path
      fillRule="evenodd"
      d="M12 3.4 1.9 10.4v1.1h1.85v8.85a0.75 0.75 0 0 0 0.75 0.75h15a0.75 0.75 0 0 0 0.75-0.75V11.5h1.85v-1.1zM12 6.35a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM5.9 12.9h2.5v2.4H5.9zm9.7 0h2.5v2.4h-2.5zM5.9 16.9h2.5v2.4H5.9zm9.7 0h2.5v2.4h-2.5zm-5.45 4.2v-3.3a1.85 1.85 0 0 1 3.7 0v3.3z"
    />
  </svg>
);

export const CapGlyph = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3 1.3 8.35a0.6 0.6 0 0 0 0 1.07L12 14.77l10.7-5.35a0.6 0.6 0 0 0 0-1.07z" />
    <path d="M5.85 12.2v4.35c0 0.3 0.1 0.58 0.29 0.81C7.4 18.93 9.5 20.2 12 20.2s4.6-1.27 5.86-2.84c0.19-0.23 0.29-0.51 0.29-0.81V12.2L12 15.28z" />
    <path d="M20.6 10.6h1.1v5.1a1.55 1.55 0 1 1-1.1 0z" />
  </svg>
);
