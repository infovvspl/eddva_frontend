// ContactPage.jsx — route: /contact
// Sub-page of the new website mockup, sharing the one-pager's chrome.
// The footer keeps id="nw-contact"; this page owns id="nw-contact-page" so the
// two never collide when both are on screen.
//
// Uses ContactHero instead of the shared PageHead — this page has its own
// supplied banner image (assets/contactbg.png), which every other sub-page
// does not.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import ContactHero from "../components/ContactHero";
import ContactSection from "../components/ContactSection";
import ContactSteps from "../components/ContactSteps";
import FaqSection from "../components/FaqSection";
import Footer from "../components/Footer";

const ContactPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <ContactHero />
        <ContactSection />
        <ContactSteps />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
