// FooterSkyline.jsx — New Website Mockup
// Decorative campus skyline along the bottom of the footer frame.
//
// The reference footer ends on an illustrated monument strip; this is the same
// device rendered as an education skyline — school, library, hostel, dome,
// clock tower — in EDDVA blues rather than the reference's terracotta.
//
// Drawn rather than imported so it tints from the footer's own palette and
// costs no image request. `slice` keeps the buildings' proportions while the
// band stretches to any width.

const FooterSkyline = () => (
  <div className="nw-footer__skyline" aria-hidden="true">
    <svg viewBox="0 0 1440 190" preserveAspectRatio="xMidYMax slice" className="nw-footer__skyline-svg">
      {/* Back layer — faint, sets depth */}
      <g fill="#2f5fb8" opacity="0.30">
        <rect x="60"   y="86"  width="96"  height="104" rx="4" />
        <rect x="250"  y="60"  width="70"  height="130" rx="4" />
        <rect x="470"  y="96"  width="120" height="94"  rx="4" />
        <rect x="800"  y="70"  width="86"  height="120" rx="4" />
        <rect x="1030" y="92"  width="140" height="98"  rx="4" />
        <rect x="1290" y="64"  width="78"  height="126" rx="4" />
        <circle cx="285"  cy="60" r="35" />
        <circle cx="1329" cy="64" r="39" />
      </g>

      {/* Mid layer — the recognisable buildings */}
      <g fill="#4b7fd4" opacity="0.55">
        {/* School with a gable, clock and flag */}
        <path d="M150 190v-84l84-46 84 46v84z" />
        <path d="M234 60V30" stroke="#4b7fd4" strokeWidth="5" />
        <path d="M234 32h30l-8 10 8 10h-30z" />
        {/* Library block with a colonnade */}
        <rect x="560" y="98" width="210" height="92" rx="4" />
        <path d="M560 98 665 58l105 40z" />
        {/* Dome hall */}
        <rect x="900" y="110" width="150" height="80" rx="4" />
        <path d="M975 52a55 55 0 0 1 55 58H920a55 55 0 0 1 55-58z" />
        <rect x="971" y="34" width="8" height="20" rx="4" />
        {/* Tower */}
        <rect x="1180" y="66" width="54" height="124" rx="4" />
        <path d="M1207 34l32 32h-64z" />
      </g>

      {/* Front layer — solid silhouette with window cut-outs */}
      <g fill="#1a56db" opacity="0.75">
        <path
          fillRule="evenodd"
          d="M0 190v-58h120v58zm22-44h20v20H22zm44 0h20v20H66zM330 190v-72h150v72zm26-52h22v22h-22zm48 0h22v22h-22zm48 0h22v22h-22zM680 190v-64h130v64zm26-46h20v22h-20zm44 0h20v22h-20zM1080 190v-70h140v70zm26-50h22v22h-22zm46 0h22v22h-22zM1330 190v-60h110v60zm24-42h20v20h-20zm42 0h20v20h-20z"
        />
      </g>

      {/* Trees along the kerb */}
      <g fill="#1a56db" opacity="0.55">
        <ellipse cx="300" cy="164" rx="17" ry="24" />
        <rect x="296" y="180" width="8" height="12" rx="3" />
        <ellipse cx="640" cy="170" rx="14" ry="20" />
        <rect x="636" y="184" width="8" height="10" rx="3" />
        <ellipse cx="1046" cy="166" rx="16" ry="22" />
        <rect x="1042" y="182" width="8" height="11" rx="3" />
        <ellipse cx="1280" cy="172" rx="13" ry="18" />
        <rect x="1276" y="186" width="8" height="9" rx="3" />
      </g>

      {/* Ground line */}
      <rect x="0" y="186" width="1440" height="4" fill="#1a56db" opacity="0.85" />
    </svg>
  </div>
);

export default FooterSkyline;
