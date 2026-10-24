// TeacherSolutionPage.jsx — route: /solution/teachers
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import RoleDetail from "../components/RoleDetail";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { roleSolutions, ROLE_PAGE_ACCENT } from "../data/solutions";

const teachersSource = roleSolutions.find(r => r.id === "nw-sol-teachers");
const teachers = teachersSource && { ...teachersSource, ...ROLE_PAGE_ACCENT };
const teacherCapabilityCount = teachers
  ? teachers.groups.reduce((sum, group) => sum + group.items.length, 0)
  : 0;

const TeacherSolutionPage = () => {
  const { t } = useTranslation("solutions");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {teachers && (
          <PageHead
            id="nw-teacher-sol-head"
            title={t("pages.teachers.title")}
            accent={t("pages.teachers.accent")}
            lead={t("pages.teachers.lead")}
            icon={teachers.Icon}
            color={teachers.color}
            bg={teachers.bg}
            stats={[
              { value: teacherCapabilityCount, label: t("pages.capabilities") },
              { value: teachers.groups.length, label: t("pages.categories") },
            ]}
          />
        )}
        {teachers && <RoleDetail role={teachers} />}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default TeacherSolutionPage;
