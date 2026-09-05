// StudentSolutionPage.jsx — route: /solution/students
import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import RoleDetail from "../components/RoleDetail";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { roleSolutions } from "../data/solutions";

const students = roleSolutions.find(r => r.id === "nw-sol-students");
const studentCapabilityCount = students
  ? students.groups.reduce((sum, group) => sum + group.items.length, 0)
  : 0;

const StudentSolutionPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {students && (
          <PageHead
            id="nw-student-sol-head"
            title="EDDVA for"
            accent="Students"
            lead="Personalized learning paths, progress tracking and everything a student needs in one place."
            icon={students.Icon}
            color={students.color}
            bg={students.bg}
            stats={[
              { value: studentCapabilityCount, label: "Capabilities" },
              { value: students.groups.length, label: "Categories" },
            ]}
          />
        )}
        {students && <RoleDetail role={students} />}
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default StudentSolutionPage;
