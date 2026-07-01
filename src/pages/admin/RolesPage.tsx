import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Plus, X, Trash2, Edit2, Loader2, Check, AlertCircle, Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/hooks/use-roles";
import type { CustomRole } from "@/lib/api/roles";

const AVAILABLE_MODULES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Access to general stats and dashboard widgets' },
  { key: 'staff', label: 'Staff Management', description: 'View and create staff members' },
  { key: 'students', label: 'Student Directory', description: 'View, add, and manage students list' },
  { key: 'batches', label: 'Batch/Class Settings', description: 'Create and configure student batches' },
  { key: 'content', label: 'Content Library', description: 'Manage subjects, chapters, topics, and upload resources' },
  { key: 'mock_tests', label: 'Mock Test Creator', description: 'Create, update, and publish mock tests' },
  { key: 'lectures', label: 'Lectures / Sessions', description: 'Schedule and manage live or recorded lectures' },
  { key: 'doubts', label: 'Doubt Queue', description: 'View and resolve student doubt queries' },
  { key: 'quizzes', label: 'Quizzes & Practice', description: 'Create practice questions and quick quizzes' },
  { key: 'reports', label: 'Reports & Downloads', description: 'View and export attendance or fee reports' },
  { key: 'analytics', label: 'Analytics Dashboard', description: 'View student performance analytics' },
  { key: 'calendar', label: 'Coaching Calendar', description: 'Schedule calendar events and view holidays' },
  { key: 'notifications', label: 'Notifications Sender', description: 'Broadcast notices and announcements' },
  { key: 'settings', label: 'Institute Settings', description: 'Manage organization profile, billing, and branding' },
];

type FormMode = "list" | "create" | "edit";

const RolesPage = () => {
  const { data: roles, isLoading } = useRoles();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const [mode, setMode] = useState<FormMode>("list");
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const [error, setError] = useState("");

  const handleEditClick = (role: CustomRole) => {
    setSelectedRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    });
    setMode("edit");
    setError("");
  };

  const handleCreateClick = () => {
    setSelectedRole(null);
    setForm({
      name: "",
      description: "",
      permissions: ["dashboard"],
    });
    setMode("create");
    setError("");
  };

  const handleTogglePermission = (key: string) => {
    setForm(prev => {
      const exists = prev.permissions.includes(key);
      const updated = exists 
        ? prev.permissions.filter(p => p !== key) 
        : [...prev.permissions, key];
      return { ...prev, permissions: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      if (mode === "create") {
        await createRoleMutation.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: form.permissions,
        });
      } else if (mode === "edit" && selectedRole) {
        await updateRoleMutation.mutateAsync({
          id: selectedRole.id,
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: form.permissions,
        });
      }
      setMode("list");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save role");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this custom role? Staff members with this role will lose their custom permissions.")) {
      return;
    }

    try {
      await deleteRoleMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete role");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleList = Array.isArray(roles) ? roles : [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <PageHeader 
        title="Roles & Permissions" 
        subtitle="Manage dynamic staff roles and access control lists" 
        actions={
          mode === "list" ? (
            <Button onClick={handleCreateClick} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl">
              <Plus className="w-4 h-4" /> Create Custom Role
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setMode("list")} className="gap-2 rounded-2xl">
              <X className="w-4 h-4" /> Back to List
            </Button>
          )
        }
      />

      <AnimatePresence mode="wait">
        {mode === "list" ? (
          <motion.div 
            key="list" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {roleList.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-3xl text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-30 text-slate-400" />
                <p className="font-bold text-slate-700">No custom roles yet</p>
                <p className="text-sm text-slate-400 mt-1">Create a custom role to define specific access capabilities for your staff.</p>
                <Button onClick={handleCreateClick} className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl">
                  <Plus className="w-4 h-4" /> Get Started
                </Button>
              </div>
            ) : (
              roleList.map((role) => (
                <motion.div 
                  key={role.id}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(role)} 
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(role.id)} 
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mt-4">{role.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {role.description || "No description provided."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {role.permissions.map((perm) => {
                        const moduleObj = AVAILABLE_MODULES.find(m => m.key === perm);
                        return (
                          <span 
                            key={perm} 
                            className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                          >
                            {moduleObj?.label || perm}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Permissions: {role.permissions.length}</span>
                    <span>Created: {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : ""}</span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.form 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {mode === "create" ? "Create Custom Role" : `Edit Role: ${selectedRole?.name}`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Specify name, description, and module access check list.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50/50 border border-red-200 rounded-2xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Role Name</label>
                  <input 
                    required 
                    placeholder="e.g. Admission Counselor, Content Incharge" 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea 
                    rows={4}
                    placeholder="Describe role responsibilities and operational scope..." 
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none" 
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">Permissions Note:</p>
                    <p>Staff members assigned to this role will only see checked pages in their navigation side panel.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Module Permissions Check Matrix</label>
                
                <div className="border border-slate-200 rounded-2xl max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                  {AVAILABLE_MODULES.map((module) => {
                    const isChecked = form.permissions.includes(module.key);
                    return (
                      <div 
                        key={module.key}
                        onClick={() => handleTogglePermission(module.key)}
                        className={`flex items-start gap-3.5 p-3.5 cursor-pointer transition-all hover:bg-slate-50 select-none ${
                          isChecked ? "bg-blue-50/20" : ""
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isChecked 
                            ? "bg-blue-600 border-blue-600 text-white" 
                            : "border-slate-300 bg-white"
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{module.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{module.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMode("list")} 
                className="px-5 h-11 border-slate-200 rounded-2xl font-bold transition-all text-slate-600"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending} 
                className="px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-sm gap-2"
              >
                {(createRoleMutation.isPending || updateRoleMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Role"
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RolesPage;
