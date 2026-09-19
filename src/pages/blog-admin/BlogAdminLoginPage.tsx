// BlogAdminLoginPage.tsx — route: /blog-admin/login
// Its own login, not the LMS's — see lib/api/blogAdmin.ts and the backend's
// modules/blog-admin-auth for why this is deliberately a separate system.

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Newspaper, User } from 'lucide-react';
import { loginBlogAdmin } from '@/lib/api/blogAdmin';

export default function BlogAdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Enter a username and password');
      return;
    }
    setLoading(true);
    try {
      await loginBlogAdmin(username.trim(), password);
      navigate('/blog-admin', { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Newspaper className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-black text-slate-900 dark:text-white">Blog Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage EDDVA's blog posts</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <label className="mb-3 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Username
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </label>

          <label className="mb-4 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Password
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </label>

          {error && <p className="mb-4 text-xs font-bold text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          This is a separate login from the main EDDVA platform.
        </p>
      </div>
    </div>
  );
}
