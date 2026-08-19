import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient as api } from '@/lib/api/client';
import * as LucideIcons from 'lucide-react';

// Common icons for the dropdown
const COMMON_ICONS = [
  'Shield', 'Users', 'UserCog', 'Package', 'ShoppingCart', 'Truck', 
  'BookOpen', 'Library', 'Wallet', 'Receipt', 'BarChart3', 'GraduationCap', 
  'Calendar', 'ClipboardList', 'Bus', 'Building2', 'TrendingUp'
];

export default function SuperAdminErpModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    path: '',
    icon: 'Shield',
    color: 'indigo',
    sort_order: 0,
    is_active: true
  });

  const fetchModules = async () => {
    try {
      const res = await api.get('/super-admin/school/erp-modules');
      setModules(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to fetch ERP modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleOpenModal = (mod = null) => {
    if (mod) {
      setEditingModule(mod);
      setFormData({
        key: mod.key,
        name: mod.name,
        description: mod.description || '',
        path: mod.path || '',
        icon: mod.icon,
        color: mod.color,
        sort_order: mod.sort_order,
        is_active: mod.is_active
      });
    } else {
      setEditingModule(null);
      setFormData({
        key: '',
        name: '',
        description: '',
        path: '',
        icon: 'Shield',
        color: 'indigo',
        sort_order: 0,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingModule) {
        await api.put(`/super-admin/school/erp-modules/${editingModule.id}`, formData);
        toast.success('Module updated successfully');
      } else {
        await api.post('/super-admin/school/erp-modules', formData);
        toast.success('Module created successfully');
      }
      setShowModal(false);
      fetchModules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save module');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">ERP Modules Master</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage global ERP modules and available features</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
        >
          <Plus size={16} /> Add Module
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-bold">Module</th>
                <th className="px-6 py-4 font-bold">Key / Path</th>
                <th className="px-6 py-4 font-bold">Sort</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading modules...</td>
                </tr>
              ) : modules.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No modules found</td>
                </tr>
              ) : (
                modules.map(mod => {
                  const Icon = LucideIcons[mod.icon] || LucideIcons.Box;
                  return (
                    <tr key={mod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${mod.color}-50 text-${mod.color}-600 dark:bg-${mod.color}-950/30 dark:text-${mod.color}-400`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{mod.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{mod.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-slate-600 dark:text-slate-300">{mod.key}</p>
                        <p className="text-xs text-slate-400">{mod.path || 'No path (Coming Soon)'}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {mod.sort_order}
                      </td>
                      <td className="px-6 py-4">
                        {mod.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <CheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <XCircle size={14} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(mod)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingModule ? 'Edit Module' : 'Create Module'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1.5">Module Key (Slug)</label>
                <input
                  required
                  type="text"
                  value={formData.key}
                  onChange={e => setFormData({ ...formData, key: e.target.value })}
                  placeholder="e.g. inventory"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  disabled={!!editingModule} // Don't allow changing key if editing
                />
                {!editingModule && <p className="text-[10px] text-slate-500 mt-1">Must be unique. Used for permissions.</p>}
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1.5">Display Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Inventory Management"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5">Route Path (Optional)</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={e => setFormData({ ...formData, path: e.target.value })}
                  placeholder="e.g. /school/admin/inventory"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave empty to show "Coming Soon"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    {COMMON_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5">Theme Color</label>
                  <select
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="indigo">Indigo</option>
                    <option value="blue">Blue</option>
                    <option value="sky">Sky</option>
                    <option value="emerald">Emerald</option>
                    <option value="teal">Teal</option>
                    <option value="rose">Rose</option>
                    <option value="amber">Amber</option>
                    <option value="purple">Purple</option>
                    <option value="fuchsia">Fuchsia</option>
                    <option value="slate">Slate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold">Active Module</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingModule ? 'Save Changes' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
