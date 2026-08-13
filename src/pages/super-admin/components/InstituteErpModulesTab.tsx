import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, PackageOpen, Check, Shield } from 'lucide-react';
import { apiClient as api } from '@/lib/api/client';
import * as LucideIcons from 'lucide-react';

export default function InstituteErpModulesTab({ instituteId }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [instituteId]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get(`/super-admin/school/institutes/${instituteId}/erp-modules`);
      setModules(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load ERP module assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignment = async (moduleId, currentStatus) => {
    try {
      setUpdating(moduleId);
      await api.post(`/super-admin/school/institutes/${instituteId}/erp-modules/${moduleId}/toggle`, {
        is_active: !currentStatus
      });
      toast.success('Module assignment updated');
      await fetchAssignments();
    } catch (err) {
      toast.error('Failed to update module assignment');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] md:rounded-[44px] border border-slate-100 shadow-sm p-5 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <PackageOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">ERP Modules</h3>
            <p className="text-xs font-semibold text-slate-400">Enable or disable ERP modules for this school</p>
          </div>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
          <Shield className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No ERP modules created yet.</p>
          <p className="text-sm text-slate-400">Go to ERP Modules Master to create them globally.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map(mod => {
            const Icon = LucideIcons[mod.icon] || LucideIcons.Box;
            const checked = mod.is_assigned;
            const color = mod.color || 'slate';
            
            return (
              <button
                key={mod.module_id}
                type="button"
                onClick={() => toggleAssignment(mod.module_id, checked)}
                disabled={updating === mod.module_id}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                  checked ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-600 shrink-0`}>
                  {updating === mod.module_id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{mod.name}</p>
                  <p className="text-[11px] font-semibold text-slate-400 line-clamp-1">{mod.description || 'No description'}</p>
                </div>
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                }`}>
                  {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
