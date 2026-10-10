import React, { useEffect, useRef, useState } from "react";
import { Camera, Mail, Phone, Shield, BookOpen, Users, ClipboardList, CheckCircle, Globe, MapPin, Award, Building } from "lucide-react";
import { useAuth } from "@/context/SchoolAuthContext";
import api from "@/lib/api/school-client";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// A read-only labelled value (disabled input) used in the Personal Details card.
function ReadOnlyField({ label, icon, value, type = "text" }: { label: string; icon?: React.ReactNode; value: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon}
        {label}
      </Label>
      <Input type={type} value={value} disabled readOnly className="cursor-not-allowed bg-slate-50 font-medium text-slate-800 dark:bg-slate-900 dark:text-white" />
    </div>
  );
}

// A small labelled value tile (Address, City, State …).
function InfoTile({ label, value }: { label: string; value?: string }) {
  return (
    <Card className="rounded-xl border-slate-100 bg-slate-50 px-4 py-3 shadow-none dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="break-words text-xs font-semibold text-slate-800 dark:text-white sm:text-sm">{value || "—"}</p>
    </Card>
  );
}

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

  const groupedAssignments = React.useMemo(() => {
    const groups: Record<string, {
      className: string;
      sectionName: string;
      isClassTeacher: boolean;
      subjects: string[];
    }> = {};

    assignments.forEach((ass) => {
      const key = `${ass.className}-${ass.sectionName}`;
      if (!groups[key]) {
        groups[key] = {
          className: ass.className,
          sectionName: ass.sectionName,
          isClassTeacher: !!ass.isClassTeacher,
          subjects: [],
        };
      }
      if (ass.isClassTeacher) {
        groups[key].isClassTeacher = true;
      }
      if (ass.subjectName) {
        const subNormalized = ass.subjectName.trim();
        if (subNormalized && !groups[key].subjects.includes(subNormalized)) {
          groups[key].subjects.push(subNormalized);
        }
      }
    });

    return Object.values(groups);
  }, [assignments]);


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

  const initialsCard = "rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 font-poppins sm:p-6">
      {/* Header */}
      <Card className={`${initialsCard} p-4 sm:p-6`}>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="relative size-24 shrink-0 sm:size-28">
            <ProfileAvatar
              src={avatarUrl || user?.profileImage || null}
              name={profile.name || user?.name}
              className="size-full rounded-full"
              fallbackClassName="text-inherit"
            />
            <Button
              type="button"
              size="icon"
              aria-label="Change profile photo"
              className="absolute bottom-0 right-0 size-8 rounded-full border-2 border-white shadow-md"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera size={14} />
            </Button>
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

          <div className="min-w-0">
            <h1 className="break-words text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">{profile.name}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="outline" className="border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Teacher Profile</Badge>
              {profile.employeeId && <span className="text-xs font-medium text-slate-500">ID: {profile.employeeId}</span>}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500 sm:justify-start">
              {profile.email && (
                <span className="inline-flex min-w-0 items-center gap-1.5"><Mail size={13} className="shrink-0" /><span className="truncate">{profile.email}</span></span>
              )}
              {profile.phone && (
                <span className="inline-flex items-center gap-1.5"><Phone size={13} className="shrink-0" />{profile.phone}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Personal + address */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className={initialsCard}>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-base font-semibold leading-normal tracking-normal">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <ReadOnlyField label="Full Name" value={profile.name} />
              <ReadOnlyField label="Employee ID" value={profile.employeeId} />
              <ReadOnlyField label="Email Address" type="email" value={profile.email} />
              <ReadOnlyField label="Mobile Number" value={profile.phone} />
              <ReadOnlyField label="Date of Joining" value={profile.dateOfJoining} />
              <ReadOnlyField label="Qualifications" icon={<Award size={14} className="text-blue-500" />} value={profile.qualifications} />
              <ReadOnlyField label="Nationality" icon={<Globe size={14} className="text-blue-500" />} value={profile.nationality} />
            </div>
          </CardContent>
        </Card>

        <Card className={initialsCard}>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold leading-normal tracking-normal">
              <MapPin size={18} className="text-blue-500" /> Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
            <InfoTile label="Address" value={profile.address} />
            <div className="grid grid-cols-2 gap-2">
              <InfoTile label="City" value={profile.city} />
              <InfoTile label="State" value={profile.state} />
              <InfoTile label="Country" value={profile.country} />
              <InfoTile label="Pin Code" value={profile.pinCode} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic information */}
      <Card className={initialsCard}>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold leading-normal tracking-normal">
            <Building size={18} className="text-blue-500" /> Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedAssignments.length > 0 ? (
              groupedAssignments.map((item: any, i: number) => {
                const displayClassName = item.className.toLowerCase().startsWith("class")
                  ? item.className
                  : `Class ${item.className}`;
                return (
                  <Card key={i} className="flex flex-col justify-between rounded-2xl border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <div className="flex w-full items-start justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm">
                        {displayClassName} <span className="mx-1 font-medium text-slate-400">·</span> Section {item.sectionName}
                      </p>
                      {item.isClassTeacher && (
                        <Badge variant="outline" className="shrink-0 rounded-full border-transparent bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 sm:px-3 sm:py-1 sm:text-xs">
                          Class Teacher
                        </Badge>
                      )}
                    </div>
                    {item.subjects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4">
                        {item.subjects.map((sub: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="rounded-full border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 sm:px-3.5 sm:py-1.5 sm:text-xs"
                          >
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <p className="py-2 text-xs font-semibold text-slate-400">No active assignments found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance + performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className={initialsCard}>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-base font-semibold leading-normal tracking-normal">Attendance Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-4 pt-0 sm:gap-4 sm:p-6 sm:pt-0">
            <Card className="rounded-2xl border-emerald-100 bg-emerald-50 p-3.5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:p-5">
              <div className="mb-2 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 sm:mb-3">
                <CheckCircle className="size-3.5 sm:size-[18px]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">Rate</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white sm:text-2xl md:text-3xl">{stats.attendancePercentage}</p>
            </Card>
            <Card className="rounded-2xl border-blue-100 bg-blue-50 p-3.5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30 sm:p-5">
              <div className="mb-2 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 sm:mb-3">
                <BookOpen className="size-3.5 sm:size-[18px]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider sm:text-xs">Classes</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white sm:text-2xl md:text-3xl">{stats.classesConducted}</p>
            </Card>
          </CardContent>
        </Card>

        <Card className={initialsCard}>
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="text-base font-semibold leading-normal tracking-normal">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 p-4 pt-0 sm:gap-4 sm:p-6 sm:pt-0">
            {[
              { label: "Students", value: stats.totalStudents, icon: Users, tone: "text-indigo-500" },
              { label: "Assignments", value: stats.assignmentsCreated, icon: ClipboardList, tone: "text-rose-500" },
              { label: "Assessments", value: stats.assessmentsConducted, icon: Shield, tone: "text-teal-500" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <Card key={label} className="rounded-2xl border-slate-100 bg-slate-50 p-2 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <Icon className={`mx-auto mb-1.5 size-3.5 sm:mb-3 sm:size-5 ${tone}`} />
                <p className="mb-1 truncate text-[9px] font-semibold uppercase tracking-tight text-slate-500 sm:text-[10px]">{label}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white sm:text-xl md:text-2xl">{value}</p>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
