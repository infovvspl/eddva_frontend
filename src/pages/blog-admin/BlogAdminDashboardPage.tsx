// BlogAdminDashboardPage.tsx — route: /blog-admin
// Standalone blog management panel — not nested under the LMS's
// DashboardLayout/sidebar. Guarded by presence of a valid blog-admin session
// (checked against the backend on mount), not by any LMS role.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader2, Search, RefreshCw, Plus, Pencil, Trash2, X, Image as ImageIcon,
  Eye, EyeOff, GripVertical, Newspaper, LogOut,
} from 'lucide-react';
import {
  getCurrentBlogAdmin, logoutBlogAdmin,
  getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, uploadBlogCoverImage,
  type BlogPost, type BlogPostStatus, type BlogSection, type BlogAdmin,
} from '@/lib/api/blogAdmin';
import { blogAdminToken } from '@/lib/api/blogAdminClient';
import ImageCropModal from './ImageCropModal';

const STATUSES: BlogPostStatus[] = ['DRAFT', 'PUBLISHED'];

const statusStyle: Record<BlogPostStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
};

const CATEGORY_SUGGESTIONS = ['AI in Education', 'Exam Prep', 'School Management', 'Product Updates'];

const emptySection = (): BlogSection => ({ heading: '', body: '' });

interface FormState {
  id: string | null;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  coverImage: string;
  readTime: string;
  sections: BlogSection[];
  status: BlogPostStatus;
}

const emptyForm = (): FormState => ({
  id: null,
  title: '',
  category: '',
  excerpt: '',
  author: 'EDDVA Team',
  coverImage: '',
  readTime: '',
  sections: [emptySection()],
  status: 'DRAFT',
});

export default function BlogAdminDashboardPage() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [admin, setAdmin] = useState<BlogAdmin | null>(null);

  const [items, setItems] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | ''>('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Session check ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!blogAdminToken.get()) {
      navigate('/blog-admin/login', { replace: true });
      return;
    }
    getCurrentBlogAdmin()
      .then(setAdmin)
      .catch(() => navigate('/blog-admin/login', { replace: true }))
      .finally(() => setCheckingSession(false));
  }, [navigate]);

  const handleLogout = () => {
    logoutBlogAdmin();
    navigate('/blog-admin/login', { replace: true });
  };

  // ── Posts ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBlogPosts({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    if (!checkingSession && admin) load();
  }, [checkingSession, admin, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setForm({
      id: post.id,
      title: post.title,
      category: post.category || '',
      excerpt: post.excerpt || '',
      author: post.author || '',
      coverImage: post.coverImage || '',
      readTime: post.readTime ? String(post.readTime) : '',
      sections: post.sections && post.sections.length > 0 ? post.sections : [emptySection()],
      status: post.status,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setForm(emptyForm());
  };

  const updateSection = (index: number, patch: Partial<BlogSection>) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const addSection = () => setForm((f) => ({ ...f, sections: [...f.sections, emptySection()] }));

  const removeSection = (index: number) =>
    setForm((f) => ({ ...f, sections: f.sections.filter((_, i) => i !== index) }));

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    try {
      const { url } = await uploadBlogCoverImage(blob);
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Cover image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (statusOverride?: BlogPostStatus) => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const sections = form.sections
      .map((s) => ({ heading: s.heading.trim(), body: s.body.trim() }))
      .filter((s) => s.heading || s.body);

    const payload = {
      title: form.title.trim(),
      category: form.category.trim() || undefined,
      excerpt: form.excerpt.trim() || undefined,
      author: form.author.trim() || undefined,
      coverImage: form.coverImage.trim() || undefined,
      readTime: form.readTime ? Number(form.readTime) : undefined,
      sections,
      status: statusOverride || form.status,
    };

    setSaving(true);
    try {
      if (form.id) {
        await updateBlogPost(form.id, payload);
        toast.success('Blog post updated');
      } else {
        await createBlogPost(payload);
        toast.success('Blog post created');
      }
      closeForm();
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save blog post');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const nextStatus: BlogPostStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setItems((list) => list.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p)));
    try {
      await updateBlogPost(post.id, { status: nextStatus });
    } catch (e: any) {
      setItems((list) => list.map((p) => (p.id === post.id ? { ...p, status: post.status } : p)));
      toast.error('Could not update status');
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeletingId(post.id);
    try {
      await deleteBlogPost(post.id);
      setItems((list) => list.filter((p) => p.id !== post.id));
      setTotal((t) => t - 1);
      toast.success('Blog post deleted');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not delete blog post');
    } finally {
      setDeletingId(null);
    }
  };

  if (checkingSession) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  if (!admin) return null; // navigating to /blog-admin/login

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      {/* Its own top bar — no LMS sidebar/shell */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Newspaper className="h-4 w-4" />
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white">Blog Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Signed in as <b>{admin.name || admin.username}</b></span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Posts</h1>
            <p className="text-sm text-slate-500">Shown on the marketing site's /blog · {total} total</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> New post
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Search title, excerpt…"
              className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'PUBLISHED' ? 'Published' : 'Draft'}</option>)}
          </select>
        </div>

        {/* Create / edit panel */}
        {formOpen && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {form.id ? 'Edit post' : 'New post'}
              </h2>
              <button onClick={closeForm} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="How AI Is Personalising Learning for Every Student"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Category
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  list="blog-category-suggestions"
                  placeholder="AI in Education"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <datalist id="blog-category-suggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </label>

              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Author
                <input
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Excerpt
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  placeholder="One or two sentences shown on the blog card and listing."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Read time (minutes)
                <input
                  type="number"
                  min={1}
                  value={form.readTime}
                  onChange={(e) => setForm((f) => ({ ...f, readTime: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <div className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Cover image
                <div className="mt-1 flex items-start gap-3">
                  {form.coverImage ? (
                    <a href={form.coverImage} target="_blank" rel="noreferrer" className="block flex-shrink-0">
                      <img src={form.coverImage} alt="" className="h-24 w-40 rounded-lg border border-slate-200 object-cover dark:border-slate-700" />
                    </a>
                  ) : (
                    <span className="flex h-24 w-40 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                      <ImageIcon className="h-6 w-6" />
                    </span>
                  )}
                  <div className="flex flex-col items-start gap-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      {uploading ? 'Uploading…' : form.coverImage ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ''; }}
                      />
                    </label>
                    {form.coverImage && (
                      <button onClick={() => setForm((f) => ({ ...f, coverImage: '' }))} className="text-xs font-bold text-red-500 hover:underline">
                        Remove
                      </button>
                    )}
                    <span className="text-[11px] font-normal text-slate-400">Shown at 16:9 on the site — this preview matches that crop.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Body sections</span>
                <button onClick={addSection} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add section
                </button>
              </div>
              <div className="space-y-2">
                {form.sections.map((section, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-2 flex items-center gap-2">
                      <GripVertical className="h-4 w-4 flex-shrink-0 text-slate-300" />
                      <input
                        value={section.heading}
                        onChange={(e) => updateSection(i, { heading: e.target.value })}
                        placeholder="Section heading"
                        className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-bold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      {form.sections.length > 1 && (
                        <button onClick={() => removeSection(i)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={section.body}
                      onChange={(e) => updateSection(i, { body: e.target.value })}
                      rows={6}
                      placeholder={'Section body text\n\nLeave a blank line between paragraphs.\n- Start a line with "- " for a bullet point\nUse **word** for bold text'}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Formatting: leave a blank line between paragraphs, start a line with <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">- </code> for a bullet, wrap text in <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">**bold**</code> for bold.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save draft
              </button>
              <button
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Publish
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="grid h-64 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : items.length === 0 ? (
          <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 text-slate-400 dark:border-slate-700">No blog posts yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((post) => (
              <div key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <ImageIcon className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{post.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusStyle[post.status]}`}>
                          {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {post.category && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-bold uppercase text-slate-500 dark:bg-slate-800">{post.category}</span>}
                        {post.author && <span>{post.author}</span>}
                        <span>/blog/{post.slug}</span>
                        <span>{new Date(post.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {post.excerpt && <p className="mt-1.5 max-w-2xl text-xs text-slate-600 dark:text-slate-300">{post.excerpt}</p>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => togglePublish(post)}
                      title={post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {post.status === 'PUBLISHED' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => openEdit(post)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      disabled={deletingId === post.id}
                      className="rounded-lg border border-slate-200 p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-red-950/30"
                    >
                      {deletingId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
