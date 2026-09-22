// useBlogPosts.js — published posts for /blog and the homepage teaser.
//
// Tries the live backend first; falls back to the bundled static set on any
// failure (API unreachable) or an empty result (fresh database, nobody has
// published through the admin panel yet), so the public pages never go blank.

import { useEffect, useState } from "react";
import { getPublicBlogPosts } from "../../lib/api/blog";
import { blogPosts as staticPosts } from "../data/blog";
import { normalizeApiPost, normalizeStaticPost } from "../lib/blogNormalize";

export default function useBlogPosts() {
  const [state, setState] = useState({
    posts: staticPosts.map(normalizeStaticPost),
    loading: true,
    source: "static",
  });

  useEffect(() => {
    let cancelled = false;

    getPublicBlogPosts({ limit: 100 })
      .then(res => {
        if (cancelled) return;
        if (res.items && res.items.length > 0) {
          setState({ posts: res.items.map(normalizeApiPost), loading: false, source: "api" });
        } else {
          setState(s => ({ ...s, loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) setState(s => ({ ...s, loading: false }));
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
