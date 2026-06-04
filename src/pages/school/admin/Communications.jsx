import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Users,
  UserRound,
  BadgeCheck,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { createChatSocket } from '@/lib/chat-socket';
import { useAuth } from '@/context/SchoolAuthContext';

const PANELS = [
  { key: 'TEACHER', label: 'Admin <-> Teacher' },
  { key: 'PARENT', label: 'Admin <-> Parent' },
];

export default function Communications() {
  const { user, institute } = useAuth();
  const [activePanel, setActivePanel] = useState('TEACHER');
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    const socket = createChatSocket();
    socketRef.current = socket;
    const join = () => socket.emit('join_user', user.id);
    socket.on('connect', () => { join(); setSocketConnected(true); });
    socket.on('disconnect', () => setSocketConnected(false));
    join();

    socket.on('direct_message', (msg) => {
      // Refetch the open thread (dedupe-safe) when it concerns this peer.
      if (
        selectedUser &&
        (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)
      ) {
        api.get(`/chat/messages/${selectedUser.id}`)
          .then((res) => setMessages(Array.isArray(res.data?.data) ? res.data.data : []))
          .catch(() => {});
      }
      void fetchConversations(activePanel);
    });

    socket.on('conversation_read', () => {
      void fetchConversations(activePanel);
    });

    return () => socket.disconnect();
  }, [user?.id, selectedUser, activePanel]);

  useEffect(() => {
    void fetchConversations(activePanel);
    void fetchUsers(activePanel, search);
    setSelectedUser(null);
    setMessages([]);
  }, [activePanel]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchUsers(activePanel, search);
    }, 250);
    return () => window.clearTimeout(t);
  }, [search, activePanel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fallback poll ONLY when the realtime socket is down — the socket pushes
  // updates otherwise, so we avoid re-running the heavy conversations query.
  useEffect(() => {
    if (!selectedUser || socketConnected) return;
    const interval = window.setInterval(async () => {
      try {
        const res = await api.get(`/chat/messages/${selectedUser.id}`);
        const list = res.data?.data ?? [];
        setMessages(Array.isArray(list) ? list : []);
        void fetchConversations(activePanel);
      } catch (err) {
        console.error('Failed to poll messages', err);
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [selectedUser, activePanel, socketConnected]);

  async function fetchConversations(role) {
    try {
      const res = await api.get('/chat/conversations', { params: { role } });
      const list = res.data?.data ?? [];
      setConversations(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load conversations', err);
      setConversations([]);
    }
  }

  async function fetchUsers(role, q = '') {
    setLoadingUsers(true);
    try {
      const res = await api.get('/chat/users', { params: { role, q } });
      const list = res.data?.data ?? [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load chat users', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function openConversation(peer) {
    setSelectedUser(peer);
    setLoading(true);
    try {
      const res = await api.get(`/chat/messages/${peer.id}`);
      const list = res.data?.data ?? [];
      setMessages(Array.isArray(list) ? list : []);
      await api.patch(`/chat/messages/${peer.id}/read`);
      socketRef.current?.emit('mark_direct_read', {
        institute_id: institute?.id || user?.instituteId,
        sender_id: peer.id,
        receiver_id: user.id,
      });
      await fetchConversations(activePanel);
    } catch (err) {
      console.error('Failed to open conversation', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!selectedUser) return;
    const trimmed = messageText.trim();
    if (!trimmed && !attachment) return;

    const text = attachment
      ? `${trimmed || 'Attachment'}\n[Attachment: ${attachment.name}]`
      : trimmed;

    try {
      const res = await api.post('/chat/messages', {
        receiverId: selectedUser.id,
        content: text,
      });
      const created = res.data?.data;
      if (created) {
        setMessages((prev) => [...prev, created]);
        socketRef.current?.emit('send_direct_message', { message: created });
      }

      setMessageText('');
      setAttachment(null);
      await fetchConversations(activePanel);
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    }
  }

  const conversationMap = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => map.set(c.id, c));
    return map;
  }, [conversations]);

  const mergedList = useMemo(() => {
    return users.map((u) => ({ ...u, ...(conversationMap.get(u.id) || {}) }));
  }, [users, conversationMap]);

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-950">Communications Hub</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Real-time role-based messaging with separate panels, unread badges, and live updates.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PANELS.map((panel) => (
          <button
            key={panel.key}
            onClick={() => setActivePanel(panel.key)}
            className={`rounded-2xl px-4 py-2 text-sm font-bold tracking-tight transition-all ${
              activePanel === panel.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-blue-50'
            }`}
          >
            {panel.label}
          </button>
        ))}
      </div>

      <div className="grid h-[72vh] min-h-[560px] grid-cols-1 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl lg:grid-cols-[360px_1fr]">
        <aside className="flex flex-col border-b border-blue-100 bg-slate-50/70 lg:border-b-0 lg:border-r">
          <div className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activePanel === 'TEACHER' ? 'teachers' : 'parents'}...`}
                className="w-full rounded-2xl border border-blue-100 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {loadingUsers ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-2xl border border-transparent bg-white p-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : mergedList.length === 0 ? (
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-slate-100 bg-white p-6 text-center text-sm text-slate-400">
                No users found in this panel.
              </div>
            ) : (
              <div className="space-y-2">
                {mergedList.map((item) => {
                  const unread = Number(item.unread_count || 0);
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ y: -1 }}
                      onClick={() => openConversation(item)}
                      className={`w-full rounded-2xl border p-3 text-left transition-all ${
                        selectedUser?.id === item.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-transparent bg-white hover:border-blue-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold tracking-tight text-white">
                            {(item.name || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold tracking-tight text-slate-900">{item.name}</p>
                            <p className="truncate text-xs font-semibold text-slate-500">{item.email}</p>
                          </div>
                        </div>
                        {unread > 0 && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold tracking-tight text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 truncate text-xs font-semibold text-slate-500">
                        {item.last_message || 'No messages yet'}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex h-full flex-col bg-white">
          {!selectedUser ? (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">Select a conversation</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Start messaging in {activePanel === 'TEACHER' ? 'Admin <-> Teacher' : 'Admin <-> Parent'} panel.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold tracking-tight text-white">
                    {(selectedUser.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight text-slate-900">{selectedUser.name}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-[11px] font-bold tracking-tight uppercase text-blue-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Live
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(219,234,254,0.25)_0%,rgba(255,255,255,1)_45%)] p-4 sm:p-6">
                {loading ? (
                  <div className="space-y-3">
                    <div className="flex justify-start"><div className="h-10 w-1/2 animate-pulse rounded-2xl bg-slate-200/80" /></div>
                    <div className="flex justify-end"><div className="h-10 w-2/5 animate-pulse rounded-2xl bg-blue-200/60" /></div>
                    <div className="flex justify-start"><div className="h-14 w-3/5 animate-pulse rounded-2xl bg-slate-200/80" /></div>
                    <div className="flex justify-end"><div className="h-10 w-1/3 animate-pulse rounded-2xl bg-blue-200/60" /></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm font-semibold text-slate-400">
                    Start the conversation.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const mine = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm font-semibold shadow-sm ${
                              mine
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                : 'border border-slate-100 bg-white text-slate-700'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content ?? msg.text}</p>
                            <p className={`mt-1 text-[10px] ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                              {new Date(msg.created_at || Date.now()).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-blue-100 bg-white p-3 sm:p-4">
                <div className="flex items-end gap-2 sm:gap-3">
                  <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-blue-100 text-slate-500 hover:bg-blue-50">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    />
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="max-h-36 min-h-[46px] flex-1 resize-y rounded-2xl border border-blue-100 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {attachment && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    <Paperclip className="h-3.5 w-3.5" />
                    {attachment.name}
                    <button onClick={() => setAttachment(null)} className="text-blue-500 hover:text-blue-700">x</button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
