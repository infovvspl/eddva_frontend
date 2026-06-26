import React from "react";
import LandingLayout from "@/components/landing/LandingLayout";
import HeroSection from "@/components/home-page/Hero";
import AboutUsSection from "@/components/home-page/AboutS";
import CoursesSection from "@/components/home-page/CoursesSec";
import WhyChooseUsSection from "@/components/home-page/Why";
import DownloadAppSection from "@/components/home-page/DownloadApp";
import FAQSection from "@/components/home-page/Faq";
import CTASection from "@/components/home-page/Cta";
import VideoSection from "@/components/home-page/VideoSec";
import { FeatureSection } from "@/components/home-page/FeaturesSec";

export default function Home(): React.JSX.Element {
  return (
    <div className="flex flex-col pt-6">
      <LandingLayout>
        {/* Hero Section */}
        <HeroSection />
        <AboutUsSection />
        <VideoSection />
        {/* <CoursesSection /> */}
        <FeatureSection />
        <WhyChooseUsSection />
        <DownloadAppSection />
        <FAQSection />
        <CTASection />
      </LandingLayout>
    </div>
  );
}
