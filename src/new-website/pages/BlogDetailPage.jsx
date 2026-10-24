// BlogDetailPage.jsx — route: /blog/:slug
// One page per post. The post itself comes from useBlogPost(slug) (live
// backend, falling back to the bundled static set); useBlogPosts() supplies
// the full list for the "More from the blog" rail. An unrecognised slug
// redirects to the blog index rather than rendering an empty shell.
//
// Posts are single-language. When the site language differs from the post's,
// we jump to its translation if there is one; otherwise the post stays and a
// short notice says which language it is in.

import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import BlogPost from "../components/BlogPost";
import Footer from "../components/Footer";
import useBlogPost from "../hooks/useBlogPost";
import useBlogPosts from "../hooks/useBlogPosts";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("blog");
  const { post, loading } = useBlogPost(slug);
  const { posts: allPosts } = useBlogPosts();
  const uiLocale = i18n.language?.startsWith("hi") ? "hi" : "en";

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  const sibling = post?.translations?.find(tr => tr.locale === uiLocale);
  useEffect(() => {
    if (post && post.locale !== uiLocale && sibling) navigate(`/blog/${sibling.slug}`, { replace: true });
  }, [post, uiLocale, sibling, navigate]);

  if (!post && !loading) return <Navigate to="/blog" replace />;
  if (!post) return null;

  const otherLanguage = post.locale !== uiLocale && !sibling;

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        {otherLanguage && (
          <p className="nw-blogpost__langnote" role="status">{t(`onlyIn.${post.locale}`)}</p>
        )}
        <BlogPost post={post} allPosts={allPosts} />
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
