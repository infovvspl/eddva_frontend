// BlogPost.jsx — /blog/:slug
// One post's own page: title band, section-by-section body, then up to three
// related posts (same category first, backfilled with the newest others).
// `allPosts` (for the related rail) is passed down from BlogDetailPage's own
// useBlogPosts() call rather than fetched here.

import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, User } from "lucide-react";
import { getCategoryStyle } from "../data/blogCategoryStyle";

const formatDate = iso =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

const BlogPost = ({ post, allPosts = [] }) => {
  const { id, slug, title, category, author, date, readTime, sections, coverImage } = post;
  const { Icon, color, bg } = getCategoryStyle(category);

  const sameCategory = allPosts.filter(p => p.id !== id && p.category === category);
  const others = allPosts.filter(p => p.id !== id && p.category !== category);
  const related = [...sameCategory, ...others].slice(0, 3);

  return (
    <div className="nw-bpost" style={{ "--nw-bp-accent": color, "--nw-bp-bg": bg }}>
      {/* ── Header ── */}
      <section className="nw-bpost__hero" id={`nw-blog-${slug}`}>
        <div className="nw-bpost__hero-inner">
          <Link to="/blog" className="nw-bpost__back">
            <ArrowLeft size={15} strokeWidth={2.4} />
            All posts
          </Link>

          <span className="nw-bpost__category">{category}</span>
          <h1 className="nw-bpost__title">{title}</h1>

          <div className="nw-bpost__meta">
            <span className="nw-bpost__meta-item">
              <User size={14} strokeWidth={2.2} />
              {author}
            </span>
            <span className="nw-bpost__meta-item">
              <Calendar size={14} strokeWidth={2.2} />
              {formatDate(date)}
            </span>
            {readTime && (
              <span className="nw-bpost__meta-item">
                <Clock size={14} strokeWidth={2.2} />
                {readTime} min read
              </span>
            )}
          </div>

          {coverImage ? (
            <span className="nw-bpost__cover" aria-hidden="true">
              <img src={coverImage} alt="" />
            </span>
          ) : (
            <span className="nw-bpost__art" aria-hidden="true">
              <Icon size={40} strokeWidth={1.4} />
            </span>
          )}
        </div>
      </section>

      {/* ── Body ── */}
      <section className="nw-bpost__body">
        <div className="nw-bpost__body-inner">
          {sections.map(section => (
            <div className="nw-bpost__section" key={section.heading}>
              <h2 className="nw-bpost__h2">{section.heading}</h2>
              <p className="nw-bpost__p">{section.body}</p>
            </div>
          ))}

          <div className="nw-bpost__cta-card">
            <div>
              <h3 className="nw-bpost__cta-title">See how EDDVA puts this into practice</h3>
              <p className="nw-bpost__cta-desc">We will walk you through it on your own setup.</p>
            </div>
            <Link to="/contact" className="nw-bpost__cta" id={`nw-blog-${slug}-cta`}>
              Book a Free Demo
              <ArrowRight size={15} strokeWidth={2.6} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="nw-bpost__related">
          <div className="nw-bpost__related-inner">
            <h2 className="nw-bpost__h2">More from the blog</h2>
            <div className="nw-bpost__related-grid">
              {related.map(item => {
                const itemStyle = getCategoryStyle(item.category);
                return (
                  <Link
                    to={`/blog/${item.slug}`}
                    className="nw-bpost__related-card"
                    key={item.id}
                    style={{ "--nw-bp-accent": itemStyle.color, "--nw-bp-bg": itemStyle.bg }}
                  >
                    <span className="nw-bpost__related-thumb">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt="" loading="lazy" />
                      ) : (
                        <itemStyle.Icon size={22} strokeWidth={1.6} />
                      )}
                    </span>
                    <span className="nw-bpost__related-copy">
                      <span className="nw-bpost__related-category">{item.category}</span>
                      <span className="nw-bpost__related-title">{item.title}</span>
                    </span>
                    <ArrowRight size={16} strokeWidth={2.4} className="nw-bpost__related-arrow" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogPost;
