// blogNormalize.js — one post shape for both sources.
//
// The public pages read live posts from the admin-managed backend
// (`lib/api/blog.js`) and fall back to the bundled `data/blog.js` set when
// the API is unreachable or has no published posts yet (e.g. a fresh
// database before anyone has used the admin panel). Both are normalised to
// the same shape so BlogGrid/BlogPost never need to know which one they got.

export const normalizeApiPost = post => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  category: post.category || "General",
  excerpt: post.excerpt || "",
  author: post.author || "EDDVA Team",
  date: post.publishedAt || post.createdAt,
  readTime: post.readTime || null,
  coverImage: post.coverImage || null,
  sections: post.sections || [],
});

export const normalizeStaticPost = post => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  category: post.category,
  excerpt: post.excerpt,
  author: post.author,
  date: post.date,
  readTime: post.readTime,
  coverImage: null,
  sections: post.sections,
});
