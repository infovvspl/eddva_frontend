import React, { useEffect, useRef, useState } from "react";
import { Camera, Mail, Phone, Shield, BookOpen, Users, ClipboardList, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import api from "@/lib/api/school-client";
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
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(localStorage.getItem("teacher_avatar") || "");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [academicData, setAcademicData] = useState<any>({
    classes: [],
    sections: [],
    subjects: []
  });
  const [stats, setStats] = useState({
    attendancePercentage: "98%",
    classesConducted: 45,
    totalStudents: 120,
    assignmentsCreated: 12,
    assessmentsConducted: 4
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: localStorage.getItem("teacher_phone") || "",
        employeeId: localStorage.getItem("teacher_employeeId") || "",
        dateOfJoining: localStorage.getItem("teacher_doj") || new Date().toLocaleDateString(),
      });

      // Fetch teacher specific details
      api.get(`/teachers/${user.id}`)
        .then(res => {
          const data = res.data?.data || res.data;
          if (data) {
            setAcademicData({
              classes: data.classes || [],
              sections: data.sections || [],
              subjects: data.subjects || []
            });
            if (data.teacherProfile?.assignments) {
              setAssignments(data.teacherProfile.assignments);
            }
            if (data.employeeId) {
              setProfile(p => ({ ...p, employeeId: data.employeeId }));
            }
            if (data.createdAt) {
              setProfile(p => ({ ...p, dateOfJoining: new Date(data.createdAt).toLocaleDateString() }));
            }
            if (data.stats) {
               setStats(prev => ({ ...prev, ...data.stats }));
            }
          }
        })
        .catch(err => console.error("Failed to fetch academic data", err));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    localStorage.setItem("teacher_phone", profile.phone);
    if (avatarUrl) {
      localStorage.setItem("teacher_avatar", avatarUrl);
    }

    alert("Profile updated successfully!");
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Teacher avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "999px" }} />
          ) : (
            profile.name?.charAt(0)
          )}
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
              onChange={handleChange}
              disabled
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
              onChange={handleChange}
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

          <button className="profile-save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>

        <div className="profile-side-column space-y-6">
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
