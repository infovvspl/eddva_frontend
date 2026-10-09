// TeacherSolutionPage.jsx — route: /solution/teachers
import { useEffect } from "react";
import "../new-website.css";
import Seo from "../components/Seo";
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
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <Seo
        title="AI Tools for Teachers | Teaching & Assessment Support | EDDVA"
        description="Help teachers save preparation time with AI-powered teaching resources, PPTs, assessments, study materials and student performance insights with EDDVA"
        path="/solution/teachers"
      />
      <TopBar />
      <Navbar />
      <main>
        {teachers && (
          <PageHead
            id="nw-teacher-sol-head"
            title="EDDVA for"
            accent="Teachers"
            lead="Smart tools, lesson planning, assessments and insights — built to save teaching time, not add to it."
            icon={teachers.Icon}
            color={teachers.color}
            bg={teachers.bg}
            stats={[
              { value: teacherCapabilityCount, label: "Capabilities" },
              { value: teachers.groups.length, label: "Categories" },
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
