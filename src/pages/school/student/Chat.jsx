// Chat.jsx — route: /school/student/chat
// Real-time 1:1 messaging with subject teachers, over the same /chat backend
// and socket contract used by the teacher/admin/parent chat pages (see
// src/pages/school/teacher/ChatSystem.tsx, src/pages/school/parent/Communication.tsx).
// Previously a static mockup with no backend wiring at all.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, LifeBuoy, Megaphone, MessageSquare, Send, Users,
  Search, Reply as ReplyIcon, Edit2, Trash2, Copy, X, Check, CheckCheck,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { createChatSocket } from '@/lib/chat-socket';
import { useAuth } from '@/context/SchoolAuthContext';
import { useConfirm } from '@/context/ConfirmContext';

const infoCards = [
  { title: 'Teacher Chat', description: 'Ask subject teachers about homework, lessons, and feedback.', icon: MessageSquare, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  { title: 'Class Discussion', description: 'Discuss class topics and collaborate with classmates.', icon: Users, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { title: 'Announcements', description: 'View institute notices, exam notices, and holiday updates.', icon: Megaphone, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  { title: 'Support', description: 'Raise a support ticket and track response status.', icon: LifeBuoy, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
];

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '??';
};

function normalizeMessage(m, myId) {
  return {
    id: m.id,
    text: m.content ?? m.text ?? '',
    createdAt: m.created_at,
    time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    senderId: m.sender_id,
    mine: m.sender_id === myId,
    isEdited: !!m.is_edited,
    isDeleted: !!m.is_deleted,
    isRead: !!m.is_read,
    parentMessageId: m.parent_message_id ?? null,
  };
}

export default function Chat() {
  const { user } = useAuth();
  const confirm = useConfirm();

  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactSearch, setContactSearch] = useState('');
  const [activeContact, setActiveContact] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  const activeContactRef = useRef(null);
  const messagesEndRef = useRef(null);
  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);

  const loadContacts = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingContacts(true);
    try {
      const [usersRes, convRes] = await Promise.all([
        api.get('/chat/users', { params: { role: 'TEACHER' } }),
        api.get('/chat/conversations', { params: { role: 'TEACHER' } }),
      ]);
      const usersList = usersRes.data?.data ?? [];
      const conversations = convRes.data?.data ?? [];
      const convByPeer = new Map(conversations.map((c) => [c.peer_id, c]));
      setContacts(
        usersList.map((u) => {
          const conv = convByPeer.get(u.id);
          return {
            id: u.id,
            name: u.name || 'Teacher',
            subject: u.subject || u.designation || '',
            lastMessage: conv?.last_message || '',
            unread: Number(conv?.unread_count || 0),
            time: conv?.created_at ? new Date(conv.created_at).toLocaleDateString() : '',
          };
        })
      );
    } catch (err) {
      console.error('Failed to load teacher contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => { void loadContacts(true); }, [loadContacts]);

  const fetchMessages = useCallback(async (peerId) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/messages/${peerId}`);
      const list = res.data?.data ?? [];
      setMessages(list.map((m) => normalizeMessage(m, user?.id)));
    } catch (err) {
      console.error('Failed to load thread', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id]);

  const openContact = (contact) => {
    setActiveContact(contact);
    setReplyingTo(null);
    setEditingMessage(null);
    void fetchMessages(contact.id);
    api.patch(`/chat/messages/${contact.id}/read`).catch(() => {});
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c)));
  };

  // ── Realtime ──
  useEffect(() => {
    if (!user?.id) return undefined;
    const socket = createChatSocket();

    const join = () => socket.emit('join_user', user.id);
    socket.on('connect', () => {
      join();
      void loadContacts(false);
      if (activeContactRef.current) void fetchMessages(activeContactRef.current.id);
    });
    join();

    socket.on('direct_message', (msg) => {
      const peerId = activeContactRef.current?.id;
      if (peerId && (msg.sender_id === peerId || msg.receiver_id === peerId)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(msg.id))) return prev;
          return [...prev, normalizeMessage(msg, user.id)];
        });
        if (msg.sender_id === peerId) api.patch(`/chat/messages/${peerId}/read`).catch(() => {});
      }
      void loadContacts(false);
    });

    socket.on('message_updated', (msg) => {
      setMessages((prev) => prev.map((m) => (String(m.id) === String(msg.id) ? normalizeMessage(msg, user.id) : m)));
      void loadContacts(false);
    });

    socket.on('conversation_read', (data) => {
      const peerId = activeContactRef.current?.id;
      if (peerId && String(data.readerId) === String(peerId)) {
        setMessages((prev) => prev.map((m) => (m.mine ? { ...m, isRead: true } : m)));
      }
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !activeContact) return;
    setMessageText('');
    try {
      const res = await api.post('/chat/messages', {
        receiverId: activeContact.id,
        content: trimmed,
        parentMessageId: replyingTo?.id || null,
      });
      const created = res.data?.data;
      if (created) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(created.id))) return prev;
          return [...prev, normalizeMessage(created, user?.id)];
        });
      }
      setReplyingTo(null);
      void loadContacts(false);
    } catch (err) {
      console.error('Failed to send message', err);
      setMessageText(trimmed);
    }
  };

  const startEdit = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
    setReplyingTo(null);
  };

  const submitEdit = async () => {
    if (!editingMessage) return;
    const content = editText.trim();
    if (!content) return;
    try {
      const res = await api.patch(`/chat/messages/${editingMessage.id}/edit`, { content });
      const updated = res.data?.data;
      if (updated) {
        setMessages((prev) => prev.map((m) => (String(m.id) === String(updated.id) ? normalizeMessage(updated, user?.id) : m)));
      }
    } catch (err) {
      console.error('Failed to edit message', err);
    } finally {
      setEditingMessage(null);
      setEditText('');
    }
  };

  // Deletes by the message's own ID (not its position in the list).
  const deleteMessage = async (messageId) => {
    const ok = await confirm({
      title: 'Delete message',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/chat/messages/${messageId}`);
      const updated = res.data?.data;
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(messageId)
            ? (updated ? normalizeMessage(updated, user?.id) : { ...m, isDeleted: true, text: 'This message was deleted' })
            : m
        )
      );
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, contactSearch]);

  const messageById = useMemo(() => new Map(messages.map((m) => [String(m.id), m])), [messages]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Communication Center</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Teacher chat, class discussion, announcements, and support from one place.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {infoCards.map((item) => (
          <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`flex size-10 items-center justify-center rounded-lg ${item.tone}`}>
              <item.icon className="size-5" />
            </div>
            <h2 className="mt-4 text-sm font-black text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Contact list */}
          <div className="flex w-[260px] shrink-0 flex-col border-r border-slate-100 dark:border-slate-800">
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Teachers</h2>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search teachers"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingContacts ? (
                <div className="p-4 text-center text-xs font-semibold text-slate-400">Loading…</div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-xs font-semibold text-slate-400">No teachers found</div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => openContact(contact)}
                    className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-800 ${
                      activeContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      {getInitials(contact.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-black text-slate-900 dark:text-white">{contact.name}</p>
                        {contact.unread > 0 && (
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] font-medium text-slate-500">{contact.lastMessage || contact.subject || 'No messages yet'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Thread */}
          <div className="flex min-w-0 flex-1 flex-col">
            {!activeContact ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <MessageSquare className="mx-auto size-10 text-slate-300" />
                  <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No active conversation</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">Select a teacher from the list to start chatting.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {getInitials(activeContact.name)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-slate-950 dark:text-white">{activeContact.name}</h2>
                    {activeContact.subject && <p className="truncate text-xs font-medium text-slate-500">{activeContact.subject}</p>}
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {loadingMessages ? (
                    <div className="text-center text-xs font-semibold text-slate-400">Loading…</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-xs font-semibold text-slate-400">No messages yet — say hello!</div>
                  ) : (
                    messages.map((m) => {
                      const parent = m.parentMessageId ? messageById.get(String(m.parentMessageId)) : null;
                      return (
                        <div key={m.id} className={`group flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] ${m.mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 text-sm font-medium ${
                                m.mine
                                  ? 'rounded-br-md bg-blue-600 text-white'
                                  : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                              } ${m.isDeleted ? 'italic opacity-60' : ''}`}
                            >
                              {parent && !m.isDeleted && (
                                <div className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs opacity-80 ${m.mine ? 'border-white/50' : 'border-blue-400'}`}>
                                  {parent.isDeleted ? 'This message was deleted' : parent.text}
                                </div>
                              )}
                              {m.isDeleted ? 'This message was deleted' : m.text}
                            </div>
                            <div className="flex items-center gap-2 px-1 text-[10px] font-semibold text-slate-400">
                              <span>{m.time}</span>
                              {m.isEdited && !m.isDeleted && <span>edited</span>}
                              {m.mine && (m.isRead ? <CheckCheck className="size-3 text-blue-500" /> : <Check className="size-3" />)}

                              {!m.isDeleted && (
                                <span className="ml-1 hidden items-center gap-1.5 group-hover:flex">
                                  <button type="button" onClick={() => setReplyingTo(m)} title="Reply" className="text-slate-400 hover:text-blue-600">
                                    <ReplyIcon className="size-3" />
                                  </button>
                                  <button type="button" onClick={() => navigator.clipboard.writeText(m.text)} title="Copy" className="text-slate-400 hover:text-blue-600">
                                    <Copy className="size-3" />
                                  </button>
                                  {m.mine && (
                                    <>
                                      <button type="button" onClick={() => startEdit(m)} title="Edit" className="text-slate-400 hover:text-blue-600">
                                        <Edit2 className="size-3" />
                                      </button>
                                      <button type="button" onClick={() => deleteMessage(m.id)} title="Delete" className="text-slate-400 hover:text-rose-600">
                                        <Trash2 className="size-3" />
                                      </button>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {replyingTo && (
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wide text-blue-600">Replying to</p>
                      <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{replyingTo.text}</p>
                    </div>
                    <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-700">
                      <X className="size-4" />
                    </button>
                  </div>
                )}

                {editingMessage ? (
                  <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-blue-600">Editing message</p>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                      <button type="button" onClick={submitEdit} className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                        <Check className="size-5" />
                      </button>
                      <button type="button" onClick={() => setEditingMessage(null)} className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800">
                        <X className="size-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={sendMessage} className="border-t border-slate-100 p-4 dark:border-slate-800">
                    <div className="flex gap-2">
                      <input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        placeholder="Type a message"
                      />
                      <button type="submit" className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                        <Send className="size-5" />
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 dark:text-white">Announcement Links</h2>
              <Bell className="size-5 text-blue-600" />
            </div>
            <div className="mt-5 space-y-3">
              <Link to="/school/student/announcements" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800">
                Institute Notices
                <Megaphone className="size-4 text-blue-600" />
              </Link>
              <Link to="/school/student/assessments" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800">
                Exam Notices
                <Bell className="size-4 text-rose-600" />
              </Link>
              <Link to="/school/student/support-tickets" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800">
                Support Tickets
                <LifeBuoy className="size-4 text-emerald-600" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
