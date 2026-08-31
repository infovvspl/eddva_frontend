import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api/school-client';

const ERP_PERMISSIONS = {
  Sales: ['erp.sales.view', 'erp.sales.create', 'erp.sales.edit', 'erp.sales.delete'],
  Purchase: ['erp.purchase.view', 'erp.purchase.create', 'erp.purchase.edit', 'erp.purchase.approve'],
};

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      setLoading(true);
      const res = await api.get('/roles');
      setRoles(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(role = null) {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    }
    setIsModalOpen(true);
  }

  async function handleSaveRole(e) {
    e.preventDefault();
    if (!formData.name) return toast.error('Role name is required');
    setSaving(true);
    try {
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, formData);
        toast.success('Role updated successfully');
      } else {
        await api.post('/roles', formData);
        toast.success('Role created successfully');
      }
      setIsModalOpen(false);
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRole(id) {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await api.delete(`/roles/${id}`);
      toast.success('Role deleted');
      loadRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  }

  const togglePermission = (perm) => {
    setFormData(prev => {
      const isSelected = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: isSelected 
          ? prev.permissions.filter(p => p !== perm)
          : [...prev.permissions, perm]
      };
    });
  };

  const toggleGroup = (groupPerms) => {
    const allSelected = groupPerms.every(p => formData.permissions.includes(p));
    setFormData(prev => {
      let newPerms = [...prev.permissions];
      if (allSelected) {
        newPerms = newPerms.filter(p => !groupPerms.includes(p));
      } else {
        groupPerms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
      }
      return { ...prev, permissions: newPerms };
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-surface-950 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-600" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Create custom roles and manage access permissions for staff members.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition"
        >
          <Plus className="h-4 w-4" /> Create Role
        </button>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-surface-600">
            <thead className="bg-surface-50 text-xs uppercase font-bold text-surface-500 border-b border-surface-200">
              <tr>
                <th className="px-6 py-4">Role Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-surface-500">Loading roles...</td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-surface-500">No custom roles found. Click 'Create Role' to add one.</td>
                </tr>
              ) : (
                roles.map(role => (
                  <tr key={role.id} className="hover:bg-surface-50/50 transition">
                    <td className="px-6 py-4 font-bold text-surface-900">{role.name}</td>
                    <td className="px-6 py-4">{role.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center bg-surface-100 text-surface-700 rounded-full px-2.5 py-0.5 text-xs font-bold">
                        {Array.isArray(role.permissions) ? role.permissions.length : 0} Perms
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(role)} className="p-1.5 text-surface-400 hover:text-brand-600 rounded-lg hover:bg-surface-100 transition">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteRole(role.id)} className="p-1.5 text-surface-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-lg font-bold text-surface-950">{editingRole ? 'Edit Role' : 'Create Custom Role'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-surface-400 hover:bg-surface-100 rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1.5">Role Name *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition"
                    placeholder="E.g., ERP Manager"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1.5">Description</label>
                  <input
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 transition"
                    placeholder="Short description..."
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-surface-900 mb-3 border-b border-surface-100 pb-2">ERP Permissions</h3>
                <div className="space-y-4">
                  {Object.entries(ERP_PERMISSIONS).map(([groupName, perms]) => {
                    const allSelected = perms.every(p => formData.permissions.includes(p));
                    return (
                      <div key={groupName} className="bg-surface-50 p-4 rounded-xl border border-surface-200">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-200">
                          <span className="font-bold text-sm text-surface-800">{groupName}</span>
                          <button onClick={() => toggleGroup(perms)} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map(perm => (
                            <label key={perm} className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm)}
                                onChange={() => togglePermission(perm)}
                                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                              />
                              {perm}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-surface-100 bg-surface-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-surface-600 hover:bg-surface-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving}
                className="px-6 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
