// Shared AI feature copy.
// Used by AiFeaturesSection (the home page marquee) and AiFeatureChecklist
// (the static three-column list on /new-website/products).

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
  { id: "nw-aifeat-live",       title: "Live Interactive Classes",        img: fLive },
  { id: "nw-aifeat-recorded",   title: "Auto-Recorded Lectures",          img: fRecorded },
  { id: "nw-aifeat-material",   title: "AI-Generated Study Material",     img: fMaterial },
  { id: "nw-aifeat-assistant",  title: "AI Teaching Assistant",           img: fAssistant },
  { id: "nw-aifeat-assignment", title: "Assignment Generator & Tracker",  img: fAssignment },
  { id: "nw-aifeat-studyplans", title: "Personalized Study Plans",        img: fStudyPlans },
  { id: "nw-aifeat-visual",     title: "AI Visual Learning",              img: fVisual },
  { id: "nw-aifeat-comms",      title: "Unified Communication Platform",  img: fComms },
  { id: "nw-aifeat-gamified",   title: "Gamified Learning",               img: fGamified },
];
