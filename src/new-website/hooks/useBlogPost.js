// useBlogPost.js — one published post by slug, for /blog/:slug.
//
// Same fallback logic as useBlogPosts: tries the live backend, falls back to
// the bundled static set if that specific slug isn't there (unreachable API,
// or a post that only exists in the old static file during the transition).

import { useEffect, useState } from "react";
import { getPublicBlogPost } from "../../lib/api/blog";
import { findPost as findStaticPost } from "../data/blog";
import { normalizeApiPost, normalizeStaticPost } from "../lib/blogNormalize";

export default function useBlogPost(slug) {
  const fallback = findStaticPost(slug);

  const [state, setState] = useState({
    post: fallback ? normalizeStaticPost(fallback) : null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));

    getPublicBlogPost(slug)
      .then(post => {
        if (!cancelled) setState({ post: normalizeApiPost(post), loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        const fb = findStaticPost(slug);
        setState({ post: fb ? normalizeStaticPost(fb) : null, loading: false });
      });

    return () => { cancelled = true; };
  }, [slug]);

  return state;
}
