// PartnersStrip.jsx — New Website Mockup
// "Preferred by Educators. Trusted by Institutions."
//
// The single place partner schools appear on the page. Runs as a full-bleed
// auto-scrolling strip: the row is rendered twice so the loop is seamless,
// and the clone is aria-hidden so each school is announced once.
//
// Uses the real institute artwork from assets/logos. Each file already carries
// the school name under its crest, so the name is passed through `alt` only.

import s17 from "../assets/logos/17.png";
import s18 from "../assets/logos/18.png";
import s19 from "../assets/logos/19.png";
import s20 from "../assets/logos/20.png";
import s21 from "../assets/logos/21.png";
import s22 from "../assets/logos/22.png";
import s23 from "../assets/logos/23.png";
import s24 from "../assets/logos/24.png";
import s25 from "../assets/logos/25.png";
import s26 from "../assets/logos/26.png";

const partners = [
  { id: "nw-partner-saraswati",    name: "Saraswati Shishu Mandir",    logo: s17 },
  { id: "nw-partner-rcc",          name: "R.C.C Public School",        logo: s18 },
  { id: "nw-partner-navals",       name: "Navals National Academy",    logo: s19 },
  { id: "nw-partner-littleflower", name: "Little Flower School",       logo: s20 },
  { id: "nw-partner-udaya",        name: "Udaya International School", logo: s21 },
  { id: "nw-partner-kapilganga",   name: "Kapil Ganga Public School",  logo: s22 },
  { id: "nw-partner-sds",          name: "SDS Public School",          logo: s23 },
  { id: "nw-partner-shreeram",     name: "Shree Ram Public School",    logo: s24 },
  { id: "nw-partner-rajglobal",    name: "Raj Global Academy",         logo: s25 },
  { id: "nw-partner-bloomingbuds", name: "Blooming Buds School",       logo: s26 },
];

const Strip = ({ clone }) => (
  <div className="nw-marquee__group" aria-hidden={clone || undefined}>
    {partners.map(({ id, name, logo }) => (
      <div className="nw-partners__item" key={id} id={clone ? undefined : id}>
        <img
          src={logo}
          alt={clone ? "" : name}
          className="nw-partners__logo"
          loading="lazy"
          draggable="false"
        />
      </div>
    ))}
  </div>
);

const PartnersStrip = () => {
  return (
    <section className="nw-partners" id="nw-partners">
      <div className="nw-partners__container">

        <p className="nw-partners__title" id="nw-partners-title">
          Preferred by Educators. Trusted by Institutions.
        </p>

        <div className="nw-marquee nw-marquee--partners" id="nw-partners-marquee">
          <div className="nw-marquee__track">
            <Strip />
            <Strip clone />
          </div>
        </div>

      </div>
    </section>
  );
};

export default PartnersStrip;
