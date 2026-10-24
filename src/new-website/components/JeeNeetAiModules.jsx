// JeeNeetAiModules.jsx — /products/jee-neet-ai
// The 8 modules inside EDDVA JEE NEET AI, each opening to show its own
// capabilities.
import { useTranslation } from "react-i18next";
import { useLocalized } from "@/i18n/useLocalized";
import ModuleAccordion from "./ModuleAccordion";
import { jeeNeetAiModules as jeeNeetAiModulesData } from "../data/jeeNeetAiModules";

const JeeNeetAiModules = () => {
  const { t } = useTranslation("products");
  const modules = useLocalized("data-jeeai", jeeNeetAiModulesData);
  return (
  <ModuleAccordion
    id="nw-jee-neet-ai-modules"
    heading={t("modules.heading")}
    headingAccent="EDDVA JEE NEET AI"
    lead={t("modules.jeeAiLead")}
    modules={modules}
    defaultOpenId={modules[0]?.id}
  />
  );
};

export default JeeNeetAiModules;
