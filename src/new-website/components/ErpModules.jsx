// ErpModules.jsx — /products/erp
// The 23 modules inside EDDVA ERP, each opening to show its own capabilities.
import { useTranslation } from "react-i18next";
import { useLocalized } from "@/i18n/useLocalized";
import ModuleAccordion from "./ModuleAccordion";
import { erpModules as erpModulesData } from "../data/erpModules";

const ErpModules = () => {
  const { t } = useTranslation("products");
  const modules = useLocalized("data-erp", erpModulesData);
  return (
  <ModuleAccordion
    id="nw-erp-modules"
    heading={t("modules.heading")}
    headingAccent="EDDVA ERP"
    lead={t("modules.erpLead")}
    modules={modules}
    defaultOpenId={modules[0]?.id}
  />
  );
};

export default ErpModules;
