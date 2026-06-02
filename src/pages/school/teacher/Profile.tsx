import React, { useEffect, useRef, useState } from "react";
import { Camera, Mail, Phone, Shield, BookOpen } from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import "./Profile.css";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    bio: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(localStorage.getItem("teacher_avatar") || "");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [academicData, setAcademicData] = useState<any>({
    classes: [],
    sections: [],
    subjects: []
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "Teacher",
        phone: localStorage.getItem("teacher_phone") || "",
        department: localStorage.getItem("teacher_department") || "",
        bio: localStorage.getItem("teacher_bio") || "",
      });

      // Fetch teacher specific details (classes, sections, subjects)
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
            // Update department if it exists from DB
            if (data.teacherProfile?.department) {
              setProfile(p => ({ ...p, department: data.teacherProfile.department }));
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
    localStorage.setItem("teacher_department", profile.department);
    localStorage.setItem("teacher_bio", profile.bio);
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
          <p>{profile.role}</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h2>Personal Information</h2>

          <div className="profile-field">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={profile.department}
              onChange={handleChange}
            />
          </div>

          <div className="profile-field">
            <label>Bio</label>
            <textarea
              rows={4}
              name="bio"
              value={profile.bio}
              onChange={handleChange}
            />
          </div>

          <button className="profile-save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>

        <div className="profile-side-column">
          <div className="profile-card mb-6">
            <h2>Academic Assignments</h2>
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
                    {ass.isClassTeacher && (
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-sky-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase font-black tracking-widest shrink-0">
                        Class Teacher
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 font-semibold py-2">No active assignments found.</p>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat-card">
              <BookOpen size={22} />
              <div>
                <h3>{academicData.subjects.length || 0}</h3>
                <p>Subjects</p>
              </div>
            </div>

            <div className="profile-stat-card">
              <Shield size={22} />
              <div>
                <h3>98%</h3>
                <p>Attendance Rate</p>
              </div>
            </div>

            <div className="profile-stat-card">
              <Phone size={22} />
              <div>
                <h3>{academicData.classes.length || 0}</h3>
                <p>Classes Managed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
