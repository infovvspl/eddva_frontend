// LmsModules.jsx — /products/lms
// The 14 modules inside EDDVA AI Learn, each opening to show its own
// capabilities.
import { useTranslation } from "react-i18next";
import { useLocalized } from "@/i18n/useLocalized";
import ModuleAccordion from "./ModuleAccordion";
import { lmsModules as lmsModulesData } from "../data/lmsModules";

const LmsModules = () => {
  const { t } = useTranslation("products");
  const modules = useLocalized("data-lms", lmsModulesData);
  return (
  <ModuleAccordion
    id="nw-lms-modules"
    heading={t("modules.heading")}
    headingAccent="EDDVA AI Learn"
    lead={t("modules.lmsLead")}
    modules={modules}
    defaultOpenId={modules[0]?.id}
    tinted
  />
  );
};

export default LmsModules;
