// JeeNeetAiModules.jsx — /products/jee-neet-ai
// The 8 modules inside EDDVA JEE NEET AI, each opening to show its own
// capabilities.
import ModuleAccordion from "./ModuleAccordion";
import { jeeNeetAiModules } from "../data/jeeNeetAiModules";

const JeeNeetAiModules = () => (
  <ModuleAccordion
    id="nw-jee-neet-ai-modules"
    heading="Everything Inside"
    headingAccent="EDDVA JEE NEET AI"
    lead="Eight modules built around one goal: an AI-driven prep plan that adapts to how each student is actually doing."
    modules={jeeNeetAiModules}
    defaultOpenId={jeeNeetAiModules[0]?.id}
  />
);

export default JeeNeetAiModules;
