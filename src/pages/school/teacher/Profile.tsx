import React, { useEffect, useRef, useState } from "react";
import { Camera, Mail, Phone, Shield, BookOpen, Users, ClipboardList, CheckCircle, Globe, MapPin, Award, Building } from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import api from "@/lib/api/school-client";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import "./Profile.css";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    dateOfJoining: "",
    qualifications: "",
    nationality: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    attendancePercentage: "—",
    classesConducted: 0,
    totalStudents: 0,
    assignmentsCreated: 0,
    assessmentsConducted: 0
  });

  useEffect(() => {
    if (user) {
      setProfile(p => ({
        ...p,
        name: user.name || "",
        email: user.email || "",
      }));

      // Fetch teacher specific details from API (single source of truth)
      api.get(`/teachers/${user.id}`)
        .then(res => {
          const data = res.data?.data || res.data;
          if (data) {
            const tp = data.teacherProfile || {};
            setProfile(p => ({
              ...p,
              phone: data.phone || "",
              employeeId: tp.employeeId || "",
              dateOfJoining: tp.joiningDate
                ? new Date(tp.joiningDate).toLocaleDateString()
                : "",
              qualifications: tp.qualifications || "",
              nationality: tp.nationality || "",
              address: tp.currentAddress || "",
              city: tp.city || "",
              state: tp.state || "",
              country: tp.country || "",
              pinCode: tp.pinCode || "",
            }));
            if (tp.assignments) {
              setAssignments(tp.assignments);
            }
            if (data.stats) {
              setStats(prev => ({ ...prev, ...data.stats }));
            }
            if (data.profileImage) {
              setAvatarUrl(prev => prev ? prev : data.profileImage);
            }
          }
        })
        .catch(err => console.error("Failed to fetch teacher profile", err));
    }
  }, [user]);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <ProfileAvatar
            src={avatarUrl || user?.profileImage || null}
            name={profile.name || user?.name}
            className="w-full h-full rounded-full"
            fallbackClassName="text-inherit"
          />
          <button
            className="profile-avatar-btn"
            type="button"
            onClick={() => avatarInputRef.current?.click()}
          >
            <Camera size={16} />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const objectUrl = URL.createObjectURL(file);
              setAvatarUrl(objectUrl);
            }}
          />
        </div>

        <div>
          <h1>{profile.name}</h1>
          <p>Teacher Profile</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h2>Personal Details</h2>

          <div className="profile-field">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>
          
          <div className="profile-field">
            <label>Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={profile.employeeId}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>

          <div className="profile-field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>

          <div className="profile-field">
            <label>Mobile Number</label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>

          <div className="profile-field">
            <label>Date of Joining</label>
            <input
              type="text"
              name="dateOfJoining"
              value={profile.dateOfJoining}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>

          <div className="profile-field">
            <label>
              <span className="flex items-center gap-1.5"><Award size={14} className="text-blue-500" /> Qualifications</span>
            </label>
            <input
              type="text"
              name="qualifications"
              value={profile.qualifications}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>

          <div className="profile-field">
            <label>
              <span className="flex items-center gap-1.5"><Globe size={14} className="text-blue-500" /> Nationality</span>
            </label>
            <input
              type="text"
              name="nationality"
              value={profile.nationality}
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="profile-side-column space-y-6">
          {/* Address Information */}
          <div className="profile-card">
            <h2>
              <span className="flex items-center gap-2"><MapPin size={18} className="text-blue-500" /> Address Information</span>
            </h2>
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.address || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">City</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.city || '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">State</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.state || '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Country</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.country || '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pin Code</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.pinCode || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="profile-card">
            <h2>Academic Information</h2>
            <div className="space-y-3 mt-4">
              {assignments.length > 0 ? (
                assignments.map((ass: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-850 dark:text-slate-200">
                        {ass.className} - Section {ass.sectionName}
                      </p>
                      <p className="text-slate-500 font-semibold mt-0.5">
                        Subject: <span className="text-blue-600 dark:text-sky-400 font-bold">{ass.subjectName || 'General'}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 font-semibold py-2">No active assignments found.</p>
              )}
            </div>
          </div>

          <div className="profile-card">
            <h2>Attendance Information</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Rate</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.attendancePercentage}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                  <BookOpen size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Classes</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.classesConducted}</p>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2>Performance Summary</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <Users size={18} className="mx-auto mb-2 text-indigo-500" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mb-1">Students</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalStudents}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <ClipboardList size={18} className="mx-auto mb-2 text-rose-500" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mb-1">Assignments</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{stats.assignmentsCreated}</p>
              </div>
              <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <Shield size={18} className="mx-auto mb-2 text-teal-500" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mb-1">Assessments</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{stats.assessmentsConducted}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
