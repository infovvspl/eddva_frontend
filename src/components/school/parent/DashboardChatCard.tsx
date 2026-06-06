import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight, Sparkles, User, Headphones } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function DashboardChatCard() {
  const navigate = useNavigate();

  const { data: contacts, isLoading } = useQuery<any[]>({
    queryKey: ["parent-chat-contacts"],
    queryFn: () => parentClient.getChatContacts(),
  });

  const unreadContacts = contacts?.filter((c) => c.unread > 0) || [];
  const quickContacts = contacts?.slice(0, 3) || [];

  const handleOpenContact = (contactId: string) => {
    navigate("/school/parent/communication", { state: { openContactId: contactId } });
  };

  const roleLabel = (role?: string) =>
    role && role.toUpperCase().includes("ADMIN") ? "Administration" : "Teacher";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between min-h-[300px]"
    >
      <div>
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Communication Center</h3>
              <p className="text-[11px] font-semibold text-slate-400">Direct support and teacher chats</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-blue-100">
            <Sparkles className="h-3 w-3" /> Connect
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : unreadContacts.length > 0 ? (
          <div className="space-y-2 mb-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Unread Messages</p>
            {unreadContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleOpenContact(contact.id)}
                className="w-full flex items-center justify-between rounded-2xl bg-rose-50/50 p-3 hover:bg-rose-50 transition border border-rose-100/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-xs font-bold text-rose-700">
                    {(contact.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{contact.name}</p>
                    <p className="text-[9px] font-semibold text-slate-400 truncate">{contact.lastMessage}</p>
                  </div>
                </div>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[9px] font-black text-white shrink-0">
                  {contact.unread}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quick Contacts</p>
            {quickContacts.length > 0 ? (
              <div className="grid gap-2">
                {quickContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleOpenContact(contact.id)}
                    className="w-full flex items-center justify-between rounded-2xl bg-slate-50/50 p-2.5 hover:bg-blue-50/40 transition border border-slate-100/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                        {(contact.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{contact.name}</p>
                        <p className="text-[9px] font-medium text-slate-400">{roleLabel(contact.role)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 hover:text-blue-700">Chat</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400">No staff contacts assigned.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/school/parent/communication")}
        className="w-full mt-4 flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition"
      >
        Open Chat Center
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
