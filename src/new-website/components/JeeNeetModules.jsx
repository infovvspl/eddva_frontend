// JeeNeetModules.jsx — /products/jee-neet
// The 8 modules inside EDDVA JEE NEET, each opening to show its own
// capabilities.
import { useTranslation } from "react-i18next";
import { useLocalized } from "@/i18n/useLocalized";
import ModuleAccordion from "./ModuleAccordion";
import { jeeNeetModules as jeeNeetModulesData } from "../data/jeeNeetModules";

const JeeNeetModules = () => {
  const { t } = useTranslation("products");
  const modules = useLocalized("data-jee", jeeNeetModulesData);
  return (
  <ModuleAccordion
    id="nw-jee-neet-modules"
    heading={t("modules.heading")}
    headingAccent="EDDVA JEE NEET"
    lead={t("modules.jeeLead")}
    modules={modules}
    defaultOpenId={modules[0]?.id}
  />
  );
};

export default JeeNeetModules;
