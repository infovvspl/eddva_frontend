// BlogSection.jsx — home page teaser
// "FROM THE BLOG" — the three most recent posts, reusing the same card
// markup as /blog's grid, plus a link to the full listing. Posts come from
// useBlogPosts() (live backend, falling back to the bundled static set).

import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import useBlogPosts from "../hooks/useBlogPosts";
import { getCategoryStyle } from "../data/blogCategoryStyle";
import useInView from "../hooks/useInView";

const formatDate = iso =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const BlogSection = () => {
  const { posts } = useBlogPosts();
  const [ref, inView] = useInView({ threshold: 0.12 });

  const latest = [...posts]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  if (latest.length === 0) return null;

  return (
    <section className="nw-blogsec" id="nw-blog">
      <div className="nw-blogsec__container">

        <div className="nw-blogsec__header">
          <span className="nw-section-label">FROM THE BLOG</span>
          <h2 className="nw-blogsec__heading">Notes on AI, exam prep &amp; running a school</h2>
          <Link to="/blog" className="nw-blogsec__viewall" id="nw-blogsec-viewall">
            View all articles
            <ArrowRight size={14} strokeWidth={2.6} />
          </Link>
        </div>

        <div className={`nw-blogsec__grid${inView ? " nw-in" : ""}`} ref={ref}>
          {latest.map((post, i) => {
            const { Icon, color, bg } = getCategoryStyle(post.category);
            return (
              <Link
                to={`/blog/${post.slug}`}
                key={post.id}
                className="nw-bgrid__card"
                style={{ "--i": i, "--nw-bg-accent": color, "--nw-bg-tint": bg }}
              >
                {post.coverImage ? (
                  <span className="nw-bgrid__cover" aria-hidden="true">
                    <img src={post.coverImage} alt="" loading="lazy" />
                  </span>
                ) : (
                  <span className="nw-bgrid__art" aria-hidden="true">
                    <Icon size={34} strokeWidth={1.5} />
                  </span>
                )}

                <span className="nw-bgrid__category">{post.category}</span>
                <h3 className="nw-bgrid__title">{post.title}</h3>
                <p className="nw-bgrid__excerpt">{post.excerpt}</p>

                <div className="nw-bgrid__meta">
                  <span className="nw-bgrid__meta-item">
                    <Calendar size={13} strokeWidth={2.2} />
                    {formatDate(post.date)}
                  </span>
                  {post.readTime && (
                    <span className="nw-bgrid__meta-item">
                      <Clock size={13} strokeWidth={2.2} />
                      {post.readTime} min read
                    </span>
                  )}
                </div>

                <span className="nw-bgrid__more">
                  Read more
                  <ArrowRight size={13} strokeWidth={2.6} />
                </span>
              </Link>
            );
          })}
        </div>

        <Link to="/blog" className="nw-blogsec__viewall nw-blogsec__viewall--mobile" id="nw-blogsec-viewall-mobile">
          View all articles
          <ArrowRight size={14} strokeWidth={2.6} />
        </Link>

      </div>
    </section>
  );
};

export default BlogSection;
