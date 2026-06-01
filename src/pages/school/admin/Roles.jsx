import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get('/school/admin/roles');
        setRoles(res.data?.data || res.data || []);
      } catch (err) {
        console.error(err);
        setRoles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-sm text-surface-600">Manage roles, assign permissions, and view role assignments.</p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Roles</h2>
            <button className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-bold text-white">Create Role</button>
          </div>

          <div className="mt-4">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="w-full table-auto text-left text-sm">
                <thead>
                  <tr className="text-surface-600">
                    <th className="px-2 py-2">Role</th>
                    <th className="px-2 py-2">Description</th>
                    <th className="px-2 py-2">Users</th>
                    <th className="px-2 py-2">Permissions</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-2 py-4 text-surface-500">No roles defined yet.</td>
                    </tr>
                  )}
                  {roles.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-2 py-3 font-bold">{r.name}</td>
                      <td className="px-2 py-3">{r.description}</td>
                      <td className="px-2 py-3">{r.userCount ?? '-'}</td>
                      <td className="px-2 py-3">{(r.permissions || []).length}</td>
                      <td className="px-2 py-3">{r.status || 'ACTIVE'}</td>
                      <td className="px-2 py-3"> 
                        <button className="mr-2 text-blue-600">View</button>
                        <button className="mr-2 text-green-600">Edit</button>
                        <button className="text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
