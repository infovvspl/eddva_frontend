import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, CheckCircle, Award, Users,
  Calendar, Sparkles, BarChart3
} from "lucide-react";

import { useStudentMe } from "@/hooks/use-student";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { data: me } = useStudentMe();
  const student = me?.student;

  return (
    <div className="relative overflow-hidden w-full">

      {/* 🌈 BACKGROUND DECOR */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-300/30 blur-3xl rounded-full pointer-events-none" />

      <div className="grid grid-cols-12 gap-6 relative z-10 w-full">

        {/* LEFT MAIN */}
        <div className="col-span-9 space-y-6">

          {/* HERO BANNER */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-3xl p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 opacity-50" />
            <div className="relative z-10 space-y-4">
              <h1 className="text-3xl font-bold">
                Welcome Back, {student?.name?.split(' ')[0] || "Student"}
              </h1>
              <p className="text-indigo-100">
                You have learned 80% of your course
              </p>
              <div className="w-64 h-2 bg-indigo-400/50 rounded-full overflow-hidden">
                 <div className="h-full bg-white w-[80%] rounded-full shadow-sm" />
              </div>
              <button onClick={() => navigate("/student/courses")} className="mt-4 px-6 py-2 bg-white text-indigo-600 font-semibold rounded-full shadow-sm hover:scale-105 transition-transform">
                Continue Lessons
              </button>
            </div>
            
            {/* ILLUSTRATION PLACEHOLDER (can be an image in production) */}
            <div className="relative z-10 w-40 h-40 hidden md:block mr-10 relative">
               <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
               <img src="https://illustrations.popsy.co/amber/student-going-to-school.svg" alt="Student" className="w-full h-full object-contain relative z-10" />
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 mb-2">
            <h2 className="text-xl font-bold text-slate-800">New Courses</h2>
            <div className="flex gap-2">
               <div className="w-2 h-2 rounded-full bg-indigo-500" />
               <div className="w-2 h-2 rounded-full bg-slate-300" />
               <div className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
          </div>

          {/* NEW COURSES */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { title: "Web Development", lessons: 25, enrolled: "250+", color: "bg-purple-100", iconCol: "bg-purple-200" },
              { title: "App Development", lessons: 25, enrolled: "250+", color: "bg-blue-100",  iconCol: "bg-blue-200" },
              { title: "Social Media Marketing", lessons: 25, enrolled: "250+", color: "bg-pink-100", iconCol: "bg-pink-200" },
            ].map((course, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                 <div className={`w-full h-28 rounded-xl ${course.color} mb-4 flex items-center justify-center relative overflow-hidden`}>
                    <div className={`w-14 h-14 rounded-full ${course.iconCol} flex items-center justify-center`}>
                       <BookOpen className="w-6 h-6 text-slate-700 opacity-50" />
                    </div>
                 </div>
                 <h3 className="font-bold text-slate-800">{course.title}</h3>
                 <div className="flex justify-between items-center mt-auto pt-4 text-xs font-semibold text-slate-500">
                    <span>{course.lessons} Lessons</span>
                    <div className="flex items-center gap-1">
                       <span>{course.enrolled} Enrolled</span>
                       <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center ml-2 cursor-pointer hover:bg-indigo-600 transition-colors">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-slate-800 mt-6 mb-2">My Courses</h2>
          
          {/* MY COURSES TABLE */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
                   <tr>
                      <th className="px-6 py-4 font-semibold">Courses</th>
                      <th className="px-6 py-4 font-semibold">Start</th>
                      <th className="px-6 py-4 font-semibold">Lessons</th>
                      <th className="px-6 py-4 font-semibold text-right">Progress</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                   {[
                     { name: "Web Design", date: "5 Sept", progress: 40, lessons: "5/13", icon: "🌐" },
                     { name: "Android Development", date: "10 Sept", progress: 20, lessons: "2/19", icon: "📱" },
                     { name: "Social Media Marketing", date: "18 Sept", progress: 85, lessons: "8/12", icon: "📢" },
                     { name: "Graphic Design", date: "20 Sept", progress: 50, lessons: "5/10", icon: "🎨" },
                   ].map((course, i) => (
                     <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">{course.icon}</div>
                           <span className="font-semibold text-slate-800">{course.name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{course.date}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{course.lessons}</td>
                        <td className="px-6 py-4 text-right">
                           <span className="font-semibold text-slate-800">{course.progress}%</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-3 space-y-6">

          {/* PROFILE */}
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center relative">

            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100 rounded-full blur-2xl" />

            <img
              src="https://i.pravatar.cc/100"
              className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-indigo-100"
            />
            <h3 className="font-semibold">{student?.name || "Student"}</h3>
            <p className="text-sm text-gray-500">Student</p>
          </div>

          {/* CALENDAR */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-3">Calendar</h3>
            <div className="h-40 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100" />
          </div>

          {/* EVENTS */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
            <h3 className="font-semibold mb-3">Upcoming</h3>

            <div className="space-y-2 text-sm">
              <p>📘 Study Session</p>
              <p>🧪 Mock Test</p>
              <p>📊 Review</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}