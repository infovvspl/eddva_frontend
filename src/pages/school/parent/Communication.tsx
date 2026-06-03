import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Calendar, AlertTriangle, Send, X, CheckCircle2, Clock } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentCommunication() {
  const [activeTab, setActiveTab] = useState<"messages" | "meetings" | "grievances">("messages");

  return (
    <div className="space-y-6 md:space-y-8 h-[calc(100vh-140px)] flex flex-col">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Communication</h2>
        <p className="text-sm font-semibold text-slate-500">Connect with teachers and school administration</p>
      </div>

      <div className="flex overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100 no-scrollbar shrink-0">
        {[
          { id: "messages", label: "Messages" },
          { id: "meetings", label: "Meetings" },
          { id: "grievances", label: "Grievances" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden rounded-[2rem] bg-white shadow-sm border border-slate-100 flex flex-col">
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "meetings" && <MeetingsTab />}
        {activeTab === "grievances" && <GrievancesTab />}
      </div>
    </div>
  );
}

function MessagesTab() {
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['parent-teachers'],
    queryFn: () => parentClient.getTeachers(),
  });

  const { data: chatData, isLoading: isLoadingChat } = useQuery({
    queryKey: ['parent-chat', activeTeacherId],
    queryFn: () => activeTeacherId ? parentClient.getChatMessages(activeTeacherId) : null,
    enabled: !!activeTeacherId,
    refetchInterval: 30000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) => parentClient.sendMessage(activeTeacherId!, msg),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['parent-chat', activeTeacherId] });
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatData]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Teachers List */}
      <div className={`w-full border-r border-slate-100 bg-slate-50/50 md:w-80 md:flex flex-col ${activeTeacherId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-white">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Teachers</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingTeachers ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : teachers?.length > 0 ? (
            teachers.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setActiveTeacherId(t.id)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                  activeTeacherId === t.id ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-slate-100"
                }`}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  {t.unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {t.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-900 truncate">{t.name}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 truncate">{t.subject}</p>
                  <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">{t.lastMessage}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm font-bold text-slate-500">No teachers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!activeTeacherId ? 'hidden md:flex' : 'flex'}`}>
        {activeTeacherId ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 shrink-0">
              <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100" onClick={() => setActiveTeacherId(null)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {teachers?.find((t: any) => t.id === activeTeacherId)?.name.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{teachers?.find((t: any) => t.id === activeTeacherId)?.name}</p>
                <p className="text-xs font-semibold text-slate-500">{teachers?.find((t: any) => t.id === activeTeacherId)?.subject}</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingChat ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-2/3 rounded-2xl rounded-tl-sm bg-slate-100" />
                  <Skeleton className="h-12 w-2/3 ml-auto rounded-2xl rounded-tr-sm bg-blue-50" />
                </div>
              ) : chatData?.messages?.length > 0 ? (
                chatData.messages.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.isParent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 ${
                      msg.isParent ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                    }`}>
                      <p className="text-sm font-medium">{msg.text}</p>
                      <p className={`text-[10px] font-bold mt-1 text-right ${msg.isParent ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center opacity-50">
                  <MessageCircle className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-600">No messages yet. Send a message to start.</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendMessageMutation.mutate(message); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md disabled:opacity-50"
                >
                  <Send className="h-4 w-4 ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-50 bg-slate-50/50">
            <MessageCircle className="h-12 w-12 text-slate-400 mb-3" />
            <p className="text-sm font-bold text-slate-600">Select a teacher to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingsTab() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['parent-meetings'],
    queryFn: () => parentClient.getMeetingRequests(),
  });

  const { data: teachers } = useQuery({
    queryKey: ['parent-teachers'],
    queryFn: () => parentClient.getTeachers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => parentClient.createMeetingRequest(data),
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['parent-meetings'] });
    }
  });

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-900">My Meeting Requests</h3>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
        >
          Request Meeting
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : meetings?.length > 0 ? (
        <div className="space-y-4">
          {meetings.map((m: any, i: number) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-[15px] font-black text-slate-900">{m.teacherName}</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{m.date} • {m.timeSlot}</p>
                  {m.reason && <p className="text-xs font-medium italic text-slate-400 mt-1">"{m.reason}"</p>}
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:text-right">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                  m.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  m.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  m.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {m.status === 'Confirmed' && <CheckCircle2 className="h-3 w-3" />}
                  {m.status === 'Pending' && <Clock className="h-3 w-3" />}
                  {m.status === 'Rejected' && <X className="h-3 w-3" />}
                  {m.status}
                </span>
                {m.status === 'Pending' && (
                  <button className="block w-full text-xs font-black text-red-500 hover:text-red-600 mt-2">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center opacity-50 py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
          <Calendar className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-600">No meeting requests found</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Request Meeting</h3>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate(Object.fromEntries(fd.entries()));
            }}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Teacher</label>
                <select name="teacherId" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500">
                  <option value="">Select teacher</option>
                  {teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Preferred Date</label>
                <input type="date" name="date" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Time Slot</label>
                <select name="timeSlot" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500">
                  <option value="Morning (9-11 AM)">Morning (9-11 AM)</option>
                  <option value="Afternoon (12-2 PM)">Afternoon (12-2 PM)</option>
                  <option value="Evening (3-5 PM)">Evening (3-5 PM)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Reason (Optional)</label>
                <textarea name="reason" rows={3} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 resize-none" placeholder="What would you like to discuss?" />
              </div>
              <button type="submit" disabled={createMutation.isPending} className="w-full rounded-xl bg-blue-600 py-3.5 text-[15px] font-black text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-2">
                {createMutation.isPending ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GrievancesTab() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: grievances, isLoading } = useQuery({
    queryKey: ['parent-grievances'],
    queryFn: () => parentClient.getGrievances(),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => parentClient.submitGrievance(data),
    onSuccess: (res) => {
      alert(`Grievance submitted successfully. Ticket #${res.ticketNumber || 'GRV'}`);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['parent-grievances'] });
    }
  });

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-900">My Grievances</h3>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700"
        >
          Submit Grievance
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : grievances?.length > 0 ? (
        <div className="space-y-4">
          {grievances.map((g: any, i: number) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400">#{g.ticketNumber}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">{g.type}</span>
                </div>
                <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                  g.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                  g.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                  g.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {g.status}
                </span>
              </div>
              <h4 className="text-[15px] font-black text-slate-900">{g.subject}</h4>
              <p className="text-xs font-semibold text-slate-400 mt-1">Submitted on {g.date}</p>
              
              {g.adminResponse && (
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Admin Response</p>
                  <p className="text-sm font-medium text-slate-700">{g.adminResponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center opacity-50 py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
          <AlertTriangle className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-600">No grievances reported</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Submit Grievance</h3>
              <button onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              submitMutation.mutate(Object.fromEntries(fd.entries()));
            }}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Type</label>
                <select name="type" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500">
                  <option value="Academic">Academic</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Teacher Conduct">Teacher Conduct</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Subject</label>
                <input type="text" name="subject" required placeholder="Short summary..." className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Description</label>
                <textarea name="description" required rows={4} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 resize-none" placeholder="Provide detailed explanation..." />
              </div>
              <button type="submit" disabled={submitMutation.isPending} className="w-full rounded-xl bg-red-600 py-3.5 text-[15px] font-black text-white hover:bg-red-700 shadow-lg shadow-red-500/20 disabled:opacity-50 mt-2">
                {submitMutation.isPending ? "Submitting..." : "Submit Grievance"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
