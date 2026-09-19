// BlogGrid.jsx — /blog
// Category filter tabs (computed from whatever posts actually loaded) above
// a responsive card grid. `posts` comes from BlogPage's useBlogPosts() call —
// this component is purely presentational so it never fetches on its own.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { getCategoryStyle } from "../data/blogCategoryStyle";
import useInView from "../hooks/useInView";

const formatDate = iso =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const BlogCard = ({ post, index }) => {
  const { id, slug, title, category, excerpt, date, readTime, coverImage } = post;
  const { Icon, color, bg } = getCategoryStyle(category);
  const [ref, inView] = useInView({ threshold: 0.12 });

  return (
    <Link
      to={`/blog/${slug}`}
      ref={ref}
      id={`${id}-card`}
      className={`nw-bgrid__card${inView ? " nw-in" : ""}`}
      style={{ "--i": index, "--nw-bg-accent": color, "--nw-bg-tint": bg }}
    >
      {coverImage ? (
        <span className="nw-bgrid__cover" aria-hidden="true">
          <img src={coverImage} alt="" loading="lazy" />
        </span>
      ) : (
        <span className="nw-bgrid__art" aria-hidden="true">
          <Icon size={34} strokeWidth={1.5} />
        </span>
      )}

      <span className="nw-bgrid__category">{category}</span>
      <h3 className="nw-bgrid__title">{title}</h3>
      <p className="nw-bgrid__excerpt">{excerpt}</p>

      <div className="nw-bgrid__meta">
        <span className="nw-bgrid__meta-item">
          <Calendar size={13} strokeWidth={2.2} />
          {formatDate(date)}
        </span>
        {readTime && (
          <span className="nw-bgrid__meta-item">
            <Clock size={13} strokeWidth={2.2} />
            {readTime} min read
          </span>
        )}
      </div>

      <span className="nw-bgrid__more">
        Read more
        <ArrowRight size={13} strokeWidth={2.6} />
      </span>
    </Link>
  );
};

const BlogGrid = ({ posts }) => {
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))],
    [posts],
  );

  const filtered = useMemo(
    () => (category === "All" ? posts : posts.filter(p => p.category === category)),
    [posts, category],
  );

  return (
    <section className="nw-bgrid" id="nw-blog-grid">
      <div className="nw-bgrid__container">

        {categories.length > 2 && (
          <div className="nw-bgrid__tabs" role="tablist" aria-label="Filter posts by category">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={category === cat}
                className={`nw-bgrid__tab${category === cat ? " nw-active" : ""}`}
                id={`nw-blog-tab-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="nw-bgrid__grid">
            {filtered.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} />
            ))}
          </div>
        ) : (
          <p className="nw-bgrid__empty">No posts in this category yet.</p>
        )}

      </div>
    </section>
  );
};

export default BlogGrid;
