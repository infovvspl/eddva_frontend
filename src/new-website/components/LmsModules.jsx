// LmsModules.jsx — /products/lms
// The 14 modules inside EDDVA AI Learn, each opening to show its own
// capabilities.
import ModuleAccordion from "./ModuleAccordion";
import { lmsModules } from "../data/lmsModules";

const LmsModules = () => (
  <ModuleAccordion
    id="nw-lms-modules"
    heading="Everything Inside"
    headingAccent="EDDVA AI Learn"
    lead="Fourteen modules bringing AI into teaching, learning and everyday classroom work."
    modules={lmsModules}
    defaultOpenId={lmsModules[0]?.id}
    tinted
  />
);

export default LmsModules;
