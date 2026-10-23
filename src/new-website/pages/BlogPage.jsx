// BlogPage.jsx — route: /blog
// Listing page: PageHead banner, category-filterable grid, closing CTA band.
// Posts come from useBlogPosts() — the live backend, falling back to the
// bundled static set if the API is unreachable or empty.

import { useEffect } from "react";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import BlogGrid from "../components/BlogGrid";
import CtaBanner from "../components/CtaBanner";
import Footer from "../components/Footer";
import useBlogPosts from "../hooks/useBlogPosts";
import { Newspaper } from "lucide-react";
import { useTranslation } from "react-i18next";


const BlogPage = () => {
  const { t } = useTranslation("blog");
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const { posts } = useBlogPosts();

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead
          id="nw-blog-head"
          title={t("pageTitle")}
          accent={t("pageAccent")}
          lead={t("pageLead")}
          icon={Newspaper}
          color="#1a56db"
          bg="#eaf1fd"
          stats={[
            { value: posts.length, label: t("articles") },
          ]}
        />
        <BlogGrid posts={posts} />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
