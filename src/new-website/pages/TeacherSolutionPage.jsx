// TeacherSolutionPage.jsx — route: /solution/teachers
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import RoleDetail from "../components/RoleDetail";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { roleSolutions } from "../data/solutions";

const teachers = roleSolutions.find(r => r.id === "nw-sol-teachers");
const teacherCapabilityCount = teachers
  ? teachers.groups.reduce((sum, group) => sum + group.items.length, 0)
  : 0;

const TeacherSolutionPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
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
