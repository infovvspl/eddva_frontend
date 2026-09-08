// FaqPage.jsx — route: /faq
// The full FAQ set (10 categories, ~85 questions), too large for the
// contact page's 6-question FaqSection, which stays as-is there.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import FaqBrowser from "../components/FaqBrowser";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import { faqCategories } from "../data/faq";
import { HelpCircle } from "lucide-react";

const totalQuestions = faqCategories.reduce((sum, cat) => sum + cat.questions.length, 0);

const FaqPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-faq-head"
          title="Frequently Asked"
          accent="Questions"
          lead="Everything about EDDVA for schools, institutes, teachers, students and parents — in one place."
          icon={HelpCircle}
          color="#1a56db"
          bg="#eaf1fd"
          stats={[
            { value: totalQuestions, label: "Questions Answered" },
            { value: faqCategories.length, label: "Categories" },
          ]}
        />
        <FaqBrowser />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default FaqPage;
