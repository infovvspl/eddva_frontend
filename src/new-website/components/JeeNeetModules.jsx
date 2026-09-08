// JeeNeetModules.jsx — /products/jee-neet
// The 8 modules inside EDDVA JEE NEET, each opening to show its own
// capabilities.
import ModuleAccordion from "./ModuleAccordion";
import { jeeNeetModules } from "../data/jeeNeetModules";

const JeeNeetModules = () => (
  <ModuleAccordion
    id="nw-jee-neet-modules"
    heading="Everything Inside"
    headingAccent="EDDVA JEE NEET"
    lead="Eight modules covering structured syllabus, practice and teacher oversight from day one to exam day."
    modules={jeeNeetModules}
    defaultOpenId={jeeNeetModules[0]?.id}
  />
);

export default JeeNeetModules;
