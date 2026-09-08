// ErpModules.jsx — /products/erp
// The 23 modules inside EDDVA ERP, each opening to show its own capabilities.
import ModuleAccordion from "./ModuleAccordion";
import { erpModules } from "../data/erpModules";

const ErpModules = () => (
  <ModuleAccordion
    id="nw-erp-modules"
    heading="Everything Inside"
    headingAccent="EDDVA ERP"
    lead="Twenty-three modules covering every administrative function an institution runs day to day."
    modules={erpModules}
    defaultOpenId={erpModules[0]?.id}
  />
);

export default ErpModules;
