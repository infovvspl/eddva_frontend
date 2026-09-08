// SchoolsSection.jsx — New Website Mockup
// Auto-scrolling strip of partner schools.
//
// Each supplied asset is a finished card (logo + name on a white panel),
// so the section renders the artwork directly and keeps the name in `alt`.
// The strip is rendered twice for a seamless loop; the clone is aria-hidden.

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

const schools = [
  { id: "nw-school-saraswati",    name: "Saraswati Shishu Mandir",    logo: s17 },
  { id: "nw-school-rcc",          name: "R.C.C Public School",        logo: s18 },
  { id: "nw-school-navals",       name: "Navals National Academy",    logo: s19 },
  { id: "nw-school-littleflower", name: "Little Flower School",       logo: s20 },
  { id: "nw-school-udaya",        name: "Udaya International School", logo: s21 },
  { id: "nw-school-kapilganga",   name: "Kapil Ganga Public School",  logo: s22 },
  { id: "nw-school-sds",          name: "SDS Public School",          logo: s23 },
  { id: "nw-school-shreeram",     name: "Shree Ram Public School",    logo: s24 },
  { id: "nw-school-rajglobal",    name: "Raj Global Academy",         logo: s25 },
  { id: "nw-school-bloomingbuds", name: "Blooming Buds School",       logo: s26 },
];

const Strip = ({ clone }) => (
  <div className="nw-marquee__group" aria-hidden={clone || undefined}>
    {schools.map(({ id, name, logo }) => (
      <div className="nw-schools__card" key={id} id={clone ? undefined : id}>
        <img
          src={logo}
          alt={clone ? "" : name}
          className="nw-schools__logo"
          loading="lazy"
          draggable="false"
        />
      </div>
    ))}
  </div>
);

const SchoolsSection = () => {
  return (
    <section className="nw-schools nw-bg-frame" id="nw-schools">
      <div className="nw-schools__container">

        <h2 className="nw-schools__heading" id="nw-schools-heading">Schools</h2>

        <div className="nw-marquee nw-marquee--schools" id="nw-schools-marquee">
          <div className="nw-marquee__track">
            <Strip />
            <Strip clone />
          </div>
        </div>

      </div>
    </section>
  );
};

export default SchoolsSection;
