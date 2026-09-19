// BlogDetailPage.jsx — route: /blog/:slug
// One page per post. The post itself comes from useBlogPost(slug) (live
// backend, falling back to the bundled static set); useBlogPosts() supplies
// the full list for the "More from the blog" rail. An unrecognised slug
// redirects to the blog index rather than rendering an empty shell.

import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import BlogPost from "../components/BlogPost";
import Footer from "../components/Footer";
import useBlogPost from "../hooks/useBlogPost";
import useBlogPosts from "../hooks/useBlogPosts";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const { post, loading } = useBlogPost(slug);
  const { posts: allPosts } = useBlogPosts();

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!post && !loading) return <Navigate to="/blog" replace />;
  if (!post) return null;

  return (
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <BlogPost post={post} allPosts={allPosts} />
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
