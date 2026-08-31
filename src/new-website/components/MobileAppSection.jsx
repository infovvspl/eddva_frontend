// MobileAppSection.jsx — New Website Mockup
// "Take EDDVA Anywhere" — centred app mockup ringed by slowly orbiting
// faces and study motifs. Uses the existing EDDVA phone render from src/assets;
// the ring portraits are head crops of the project's own character art.

import {
  Smartphone, Bell, WifiOff, LineChart,
  BookOpen, GraduationCap, Trophy,
} from "lucide-react";
import appLogin from "../../assets/app1.png";
import playStore from "../../assets/playstore.png";
import appStore from "../../assets/appstore.png";
import avStudent from "../../assets/nw-app/avatar-student.png";
import avTeacher from "../../assets/nw-app/avatar-teacher.png";
import avLearner from "../../assets/nw-app/avatar-learner.png";
import avPrincipal from "../../assets/nw-app/avatar-principal.png";

const perks = [
  { id: "nw-app-learn",   title: "Learn on the move",   desc: "Classes, notes and tests in your pocket.", Icon: Smartphone },
  { id: "nw-app-alerts",  title: "Instant alerts",      desc: "Attendance, fees and notices in real time.", Icon: Bell },
  { id: "nw-app-offline", title: "Works offline",       desc: "Download lessons and study without data.",  Icon: WifiOff },
  { id: "nw-app-track",   title: "Track progress",      desc: "Live performance insights for every student.", Icon: LineChart },
];

// Decorative ring — the people who use EDDVA, interleaved with study motifs.
const orbit = [
  { face: avStudent },
  { Icon: BookOpen },
  { face: avTeacher },
  { Icon: GraduationCap },
  { face: avLearner },
  { Icon: LineChart },
  { face: avPrincipal },
  { Icon: Trophy },
];

const MobileAppSection = () => {
  return (
    <section className="nw-app" id="nw-app">
      <div className="nw-app__glow nw-app__glow--1" aria-hidden="true" />
      <div className="nw-app__glow nw-app__glow--2" aria-hidden="true" />

      <div className="nw-app__container">

        {/* TOP — copy + store badges, centred */}
        <div className="nw-app__content">
          <span className="nw-app__label">MOBILE APPLICATION</span>
          <h2 className="nw-app__heading">Take EDDVA Anywhere</h2>
          <p className="nw-app__lead">
            Students, teachers and parents stay connected on Android and iOS &ndash;
            one app for classes, progress, fees and notices.
          </p>

          <div className="nw-app__stores">
            <a href="#nw-play-store" className="nw-app__store" id="nw-store-play">
              <img src={playStore} alt="" className="nw-app__store-icon" />
              <span className="nw-app__store-text">
                <small>Get it on</small>
                <strong>Google Play</strong>
              </span>
            </a>
            <a href="#nw-app-store" className="nw-app__store" id="nw-store-ios">
              <img src={appStore} alt="" className="nw-app__store-icon" />
              <span className="nw-app__store-text">
                <small>Download on the</small>
                <strong>App Store</strong>
              </span>
            </a>
          </div>
        </div>

        {/* MIDDLE — centred phone inside a slowly rotating ring */}
        <div className="nw-app__stage">
          <ul className="nw-app__orbit" aria-hidden="true">
            {orbit.map((slot, n) => {
              const angle = (n / orbit.length) * 2 * Math.PI;
              const { face, Icon } = slot;
              return (
                <li
                  className="nw-app__orbit-item"
                  key={`nw-app-orbit-${n}`}
                  style={{
                    "--nw-x": `${50 + 50 * Math.sin(angle)}%`,
                    "--nw-y": `${50 - 50 * Math.cos(angle)}%`,
                  }}
                >
                  <span
                    className={
                      face
                        ? "nw-app__orbit-chip nw-app__orbit-chip--face"
                        : "nw-app__orbit-chip"
                    }
                  >
                    {face
                      ? <img src={face} alt="" loading="lazy" />
                      : <Icon size={22} strokeWidth={1.9} />}
                  </span>
                </li>
              );
            })}
          </ul>

          <img
            src={appLogin}
            alt="EDDVA app login screen"
            className="nw-app__phone"
            loading="lazy"
          />
        </div>

        {/* BOTTOM — the four perks */}
        <ul className="nw-app__perks">
          {perks.map(({ id, title, desc, Icon }) => (
            <li className="nw-app__perk" key={id} id={id}>
              <span className="nw-app__perk-icon" aria-hidden="true">
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <span className="nw-app__perk-text">
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
};

export default MobileAppSection;
