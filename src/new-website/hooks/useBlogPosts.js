// useBlogPosts.js — published posts for /blog and the homepage teaser, in the
// language the site is currently showing.
//
// The backend serves each language from its own cache, so this is a cheap
// read. English falls back to the bundled static set when the API is
// unreachable or empty, so the English pages never go blank. Hindi has no
// static copy: with no Hindi posts yet the list is simply empty.

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPublicBlogPosts } from "../../lib/api/blog";
import { blogPosts as staticPosts } from "../data/blog";
import { normalizeApiPost, normalizeStaticPost } from "../lib/blogNormalize";

const initialFor = locale => ({
  posts: locale === "en" ? staticPosts.map(normalizeStaticPost) : [],
  loading: true,
  source: "static",
});

export default function useBlogPosts() {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith("hi") ? "hi" : "en";
  const [state, setState] = useState(() => initialFor(locale));

  useEffect(() => {
    let cancelled = false;
    setState(initialFor(locale));

    getPublicBlogPosts({ locale, limit: 100 })
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
  }, [locale]);

  return state;
}
