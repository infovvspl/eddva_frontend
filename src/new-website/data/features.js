// Shared AI feature copy.
// Used by AiFeaturesSection — the marquee on the home page. That is currently
// the only surface showing these; the products page follows the mockup, which
// has no AI-features section.
//
// `cat` is a leftover grouping tag; nothing renders it at the moment.

import fLive        from "../assets/features/01.png";
import fMaterial    from "../assets/features/02.png";
import fRecorded    from "../assets/features/03.png";
import fStudyPlans  from "../assets/features/06.png";
import fVisual      from "../assets/features/07.png";
import fAssistant   from "../assets/features/08.png";
import fAssignment  from "../assets/features/09.png";
import fComms       from "../assets/features/10.png";
import fGamified    from "../assets/features/11.png";

export const features = [
  { id: "nw-aifeat-live",       title: "Live Interactive Classes",        img: fLive, cat: "classroom" },
  { id: "nw-aifeat-recorded",   title: "Auto-Recorded Lectures",          img: fRecorded, cat: "classroom" },
  { id: "nw-aifeat-material",   title: "AI-Generated Study Material",     img: fMaterial, cat: "content" },
  { id: "nw-aifeat-assistant",  title: "AI Teaching Assistant",           img: fAssistant, cat: "content" },
  { id: "nw-aifeat-assignment", title: "Assignment Generator & Tracker",  img: fAssignment, cat: "practice" },
  { id: "nw-aifeat-studyplans", title: "Personalized Study Plans",        img: fStudyPlans, cat: "practice" },
  { id: "nw-aifeat-visual",     title: "AI Visual Learning",              img: fVisual, cat: "content" },
  { id: "nw-aifeat-comms",      title: "Unified Communication Platform",  img: fComms, cat: "classroom" },
  { id: "nw-aifeat-gamified",   title: "Gamified Learning",               img: fGamified, cat: "practice" },
];
