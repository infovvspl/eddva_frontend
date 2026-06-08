import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Users,
  UserRound,
  BadgeCheck,
  Download,
  Eye,
  Trash2,
  Edit2,
  Reply,
  Forward,
  Copy,
  Info,
  Clock,
  Check,
  CheckCheck,
  MoreVertical,
  X,
  FileText,
  Plus,
  Phone,
  Video,
  ChevronRight,
  Smile,
  Calendar,
  User,
  ChevronDown
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { createChatSocket } from '@/lib/chat-socket';
import { useAuth } from '@/context/SchoolAuthContext';
import { getUploadUrl, uploadToS3 } from '@/lib/upload';

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

  // Track active chat peer ID
  useEffect(() => {
    window.activeChatPeerId = selectedUser?.id || null;
    return () => {
      window.activeChatPeerId = null;
    };
  }, [selectedUser]);

  // Handle userId query parameter on load/change
  useEffect(() => {
    const userIdParam = new URLSearchParams(window.location.search).get('userId');
    if (!userIdParam || users.length === 0) return;

    const peer = users.find((u) => String(u.id) === String(userIdParam));
    if (peer) {
      if (!selectedUser || String(selectedUser.id) !== String(userIdParam)) {
        openConversation(peer);
      }
    } else {
      // If not in current panel, let's search parent panel if active was TEACHER, and vice-versa
      const checkOtherPanel = async () => {
        const nextPanel = activePanel === 'TEACHER' ? 'PARENT' : 'TEACHER';
        try {
          const res = await api.get('/chat/users', { params: { role: nextPanel } });
          const otherUsers = res.data?.data ?? [];
          const found = otherUsers.find((u) => String(u.id) === String(userIdParam));
          if (found) {
            setActivePanel(nextPanel);
            setUsers(otherUsers);
            openConversation(found);
          }
        } catch (e) {
          console.error("Error looking up user in other panel:", e);
        }
      };
      void checkOtherPanel();
    }
  }, [users, activePanel]);

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [messageText, setMessageText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // Layout Columns & Details Toggle
  const [showDetails, setShowDetails] = useState(true);

  // Message Action States
  const [contextMenu, setContextMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [forwardMessage, setForwardMessage] = useState(null);

  // Attachments View
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  // Typing state
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Premium Interactive Workflows States
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showVideoMeetModal, setShowVideoMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('Discussion on Student Progress');
  const [meetDesc, setMeetDesc] = useState('Reviewing classroom schedule, assignments, and curriculum outline.');
  const [meetDuration, setMeetDuration] = useState('30 mins');
  const [meetDate, setMeetDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetTime, setMeetTime] = useState('14:00');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showSharedFilesModal, setShowSharedFilesModal] = useState(false);
  const [showMediaGalleryModal, setShowMediaGalleryModal] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [pinnedChats, setPinnedChats] = useState({});
  const [mutedChats, setMutedChats] = useState({});
  const [archivedChats, setArchivedChats] = useState({});
  const [blockedChats, setBlockedChats] = useState({});
  const [mediaLightboxUrl, setMediaLightboxUrl] = useState(null);

  // Simple custom toast trigger
  const showToast = (msg, type = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message: msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleExportChat = () => {
    if (!selectedUser) return;
    const chatLog = messages
      .map((m) => `[${new Date(m.created_at || Date.now()).toLocaleTimeString()}] ${m.sender_id === user.id ? 'Me' : selectedUser.name}: ${m.content || m.text}`)
      .join('\n');
    const blob = new Blob([chatLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_history_${selectedUser.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    showToast('Chat history exported successfully', 'success');
  };

  const handleUnavailableAction = (action) => {
    showToast(`${action} action triggered (Simulated)`, 'info');
  };

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Heartbeat / Socket Presence Integration
  useEffect(() => {
    if (!user?.id) return;
    const socket = createChatSocket();
    socketRef.current = socket;
    const join = () => socket.emit('join_user', user.id);
    socket.on('connect', () => { join(); setSocketConnected(true); });
    socket.on('disconnect', () => setSocketConnected(false));
    join();

    socket.on('direct_message', (msg) => {
      if (
        selectedUser &&
        (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)
      ) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(msg.id))) return prev;
          return [...prev, msg];
        });
        api.patch(`/chat/messages/${selectedUser.id}/read`).catch(() => {});
      }
      void fetchConversations(activePanel);
    });

    socket.on('message_updated', (msg) => {
      if (
        selectedUser &&
        (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)
      ) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, ...msg, content: msg.text } : m))
        );
      }
      void fetchConversations(activePanel);
    });

    socket.on('conversation_read', () => {
      void fetchConversations(activePanel);
    });

    socket.on('presence_change', (data) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === data.userId ? { ...u, online: data.status === 'online', lastSeen: data.lastSeen } : u))
      );
      setSelectedUser((prev) => {
        if (prev && prev.id === data.userId) {
          return { ...prev, online: data.status === 'online', lastSeen: data.lastSeen };
        }
        return prev;
      });
    });

    socket.on('typing', (data) => {
      if (selectedUser && data.senderId === selectedUser.id) {
        setPeerTyping(data.isTyping);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setPeerTyping(false);
          }, 3000);
        }
      }
    });

    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user?.id, selectedUser, activePanel]);

  useEffect(() => {
    void fetchConversations(activePanel);
    void fetchUsers(activePanel, search);
    setSelectedUser(null);
    setMessages([]);
    setReplyingTo(null);
    setEditingMessage(null);
  }, [activePanel]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchUsers(activePanel, search);
    }, 250);
    return () => window.clearTimeout(t);
  }, [search, activePanel]);

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, peerTyping]);

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
    setReplyingTo(null);
    setEditingMessage(null);
    setInChatSearch('');
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

  // File Upload Attachment handler
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("Maximum file size is 20MB");
      return;
    }
    setUploading(true);
    try {
      const presign = await getUploadUrl({
        type: 'chat-attachment',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size
      });

      await uploadToS3(file, presign.uploadUrl);

      // Send attachment message
      const res = await api.post('/chat/messages', {
        receiverId: selectedUser.id,
        content: `Sent an attachment: ${file.name}`,
        attachmentUrl: presign.fileUrl,
        attachmentName: file.name,
      });
      const created = res.data?.data;
      if (created) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(created.id))) return prev;
          return [...prev, created];
        });
      }
      await fetchConversations(activePanel);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  }

  async function sendMessage() {
    if (!selectedUser) return;
    const trimmed = messageText.trim();
    if (!trimmed) return;

    try {
      const payload = {
        receiverId: selectedUser.id,
        content: trimmed,
        parentMessageId: replyingTo?.id || null
      };

      const res = await api.post('/chat/messages', { ...payload });
      const created = res.data?.data;
      if (created) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(created.id))) return prev;
          return [...prev, created];
        });
      }

      setMessageText('');
      setReplyingTo(null);
      await fetchConversations(activePanel);
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    }
  }

  // Message Edits & Deletes
  async function submitEdit() {
    if (!editingMessage) return;
    const content = editText.trim();
    if (!content) return;
    try {
      const res = await api.patch(`/chat/messages/${editingMessage.id}/edit`, { content });
      const updated = res.data?.data;
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? { ...m, ...updated, content: updated.text } : m))
        );
      }
      setEditingMessage(null);
    } catch (err) {
      alert("Failed to edit message");
    }
  }

  async function submitDelete(messageId) {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await api.delete(`/chat/messages/${messageId}`);
      const updated = res.data?.data;
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? { ...m, ...updated, content: updated.text } : m))
        );
      }
    } catch (err) {
      alert("Failed to delete message");
    }
  }

  function handleForwardMessage(contact) {
    if (!forwardMessage) return;
    api.post('/chat/messages', {
      receiverId: contact.id,
      content: forwardMessage.content || forwardMessage.text,
      isForwarded: true,
      attachmentUrl: forwardMessage.attachment_url,
      attachmentName: forwardMessage.attachment_name,
    }).then(() => {
      setForwardMessage(null);
      alert(`Message forwarded to ${contact.name}`);
      void fetchConversations(activePanel);
    }).catch(() => {
      alert("Failed to forward message");
    });
  }

  // Handle typing socket emits
  function handleInputKeyPress() {
    if (socketRef.current && selectedUser) {
      socketRef.current.emit('typing', {
        roomId: selectedUser.room_id || '',
        isTyping: true,
        receiverId: selectedUser.id,
      });
    }
  }

  // Context Menu Helpers
  function handleContextMenu(e, msg) {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg,
    });
  }

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Merging conversation counters and presence mapping
  const conversationMap = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => map.set(c.id, c));
    return map;
  }, [conversations]);

  const mergedList = useMemo(() => {
    return users.map((u) => ({ ...u, ...(conversationMap.get(u.id) || {}) }));
  }, [users, conversationMap]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const active = conversations.length;
    const unread = conversations.reduce((acc, c) => acc + Number(c.unread_count || 0), 0);
    const onlineTeachers = users.filter((u) => u.role === 'TEACHER' && u.online).length;
    const onlineParents = users.filter((u) => u.role === 'PARENT' && u.online).length;
    return { active, unread, onlineTeachers, onlineParents };
  }, [conversations, users]);

  // Shared Files / Attachments extraction
  const sharedFiles = useMemo(() => {
    return messages.filter((m) => m.attachment_url);
  }, [messages]);

  // Message date separation & search filters
  const filteredMessages = useMemo(() => {
    if (!inChatSearch.trim()) return messages;
    return messages.filter((m) =>
      (m.content || m.text || '').toLowerCase().includes(inChatSearch.toLowerCase())
    );
  }, [messages, inChatSearch]);

  function getMessageGroupLabel(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastLabel = '';
    filteredMessages.forEach((msg) => {
      const label = getMessageGroupLabel(msg.created_at || Date.now());
      if (label !== lastLabel) {
        groups.push({ type: 'separator', label });
        lastLabel = label;
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  }, [filteredMessages]);

  const renderMeetingCard = (text) => {
    const parts = text.split('|');
    const title = parts[1] || 'Meeting';
    const dateTime = parts[2] || 'Scheduled Time';
    const duration = parts[3] || '30 mins';
    const desc = parts[4] || 'Click join below to start.';
    const url = parts[5] || 'https://meet.eddva.com';
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-3 shadow-xs max-w-sm">
        <div className="flex items-center gap-2 text-blue-600">
          <Video size={16} />
          <span className="text-[10px] font-black uppercase tracking-wider">Video Meeting Scheduled</span>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800">{title}</h4>
          <p className="text-[10px] text-slate-500 mt-1">{desc}</p>
        </div>
        <div className="flex flex-col gap-1 text-[10px] text-slate-600 bg-white/60 p-2 rounded-xl border border-blue-50/60">
          <div><strong>Time:</strong> {dateTime}</div>
          <div><strong>Duration:</strong> {duration}</div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center rounded-xl bg-blue-600 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-blue-700 transition"
        >
          Join Meeting
        </a>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4">
      {/* Top statistics Header */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Active Chats', val: stats.active, sub: 'This month' },
          { label: 'Unread Badges', val: stats.unread, sub: 'Needs reply', alert: stats.unread > 0 },
          { label: 'Online Teachers', val: stats.onlineTeachers, sub: 'Live on system' },
          { label: 'Online Parents', val: stats.onlineParents, sub: 'Connected now' },
        ].map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black ${item.alert ? 'text-red-500' : 'text-slate-800'}`}>{item.val}</span>
              <span className="text-[9px] font-bold text-slate-400">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1.5 p-1 bg-slate-50/50 rounded-2xl border border-slate-100/60 max-w-xs shrink-0">
        {PANELS.map((panel) => (
          <button
            key={panel.key}
            onClick={() => setActivePanel(panel.key)}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activePanel === panel.key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {panel.label}
          </button>
        ))}
      </div>

      {/* 3-Column Redesigned Layout */}
      <div className="h-[70vh] min-h-[540px] rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden flex relative">
        
        {/* Column 1: Contacts Sidebar */}
        <div className={`w-full lg:w-[340px] border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/10 ${selectedUser ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 bg-white border-b border-slate-100/60">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activePanel === 'TEACHER' ? 'teachers' : 'parents'}...`}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingUsers ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100/60 shadow-xs animate-pulse">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-slate-100 rounded" />
                      <div className="h-2 w-2/3 bg-slate-50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : mergedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center opacity-65">
                <Users className="h-8 w-8 text-slate-350 mb-2" />
                <p className="text-xs font-bold text-slate-500">No users found.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {mergedList.map((item) => {
                  const unread = Number(item.unread_count || 0);
                  const active = selectedUser?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => openConversation(item)}
                      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                        active
                          ? 'bg-blue-50/80 border border-blue-100/50 shadow-xs'
                          : 'hover:bg-slate-50/60 border border-transparent'
                      }`}
                    >
                      <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm">
                        {(item.name || 'U').slice(0, 1).toUpperCase()}
                        {item.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                          <span className="text-[9px] font-semibold text-slate-400 shrink-0">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[11px] font-semibold text-slate-500 truncate">
                            {item.last_message || 'No messages yet'}
                          </p>
                          {unread > 0 && (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Chat Conversation Panel */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedUser ? 'hidden lg:flex' : 'flex'}`}>
          {!selectedUser ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 opacity-60 bg-slate-50/10">
              <MessageSquare className="h-10 w-10 text-slate-350 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Select a conversation</h3>
              <p className="text-xs text-slate-400">Choose a contact to start messaging</p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button className="lg:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 text-slate-500" onClick={() => setSelectedUser(null)}>
                    <ChevronRight size={18} className="rotate-180" />
                  </button>
                  <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-black text-white">
                    {(selectedUser.name || 'U').slice(0, 1).toUpperCase()}
                    {selectedUser.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{selectedUser.name}</span>
                      {selectedUser.online && (
                        <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                          Online
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5 uppercase tracking-wide">
                      {selectedUser.role} • {!selectedUser.online && selectedUser.lastSeen ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleUnavailableAction('Search in chat')} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
                    <Search size={16} />
                  </button>
                  <button onClick={() => handleUnavailableAction('Voice call')} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
                    <Phone size={16} />
                  </button>
                  <button onClick={() => handleUnavailableAction('Video call')} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
                    <Video size={16} />
                  </button>
                  <div className="h-4 w-px bg-slate-100 mx-1" />
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className={`p-2 rounded-xl transition ${showDetails ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* Messages scrollarea */}
              <div className="flex-1 overflow-y-auto bg-slate-50/20 p-4 space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-slate-100" />
                    <div className="h-10 w-1/3 animate-pulse rounded-2xl bg-blue-100 ml-auto" />
                  </div>
                ) : groupedMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                    <MessageSquare size={32} className="text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-500">No messages yet. Send a message to start.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedMessages.map((item, idx) => {
                      if (item.type === 'separator') {
                        return (
                          <div key={`sep-${idx}`} className="flex justify-center my-3">
                            <span className="rounded-full bg-slate-100/80 px-3 py-0.5 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                              {item.label}
                            </span>
                          </div>
                        );
                      }

                      const msg = item.data;
                      const mine = msg.sender_id === user.id;

                      return (
                        <div
                          key={msg.id}
                          id={`msg-${msg.id}`}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'} transition-all duration-500 rounded-2xl ${
                            highlightedMessageId === msg.id ? 'bg-amber-100 p-2 shadow-sm' : ''
                          }`}
                          onContextMenu={(e) => handleContextMenu(e, msg)}
                        >
                          <div
                            className={`group relative max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-xs transition duration-200 ${
                              mine
                                ? 'bg-blue-50 text-slate-800 border border-blue-100/50 rounded-tr-none'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                            }`}
                          >
                            {msg.is_forwarded && (
                              <p className={`mb-1 flex items-center gap-1 text-[9px] font-bold uppercase ${mine ? 'text-blue-600' : 'text-slate-400'}`}>
                                <Forward size={10} /> Forwarded
                              </p>
                            )}

                            {msg.parent_message_id && (
                              <div className={`mb-2 border-l-2 pl-2 text-[10px] opacity-80 ${mine ? 'border-blue-300 text-blue-600' : 'border-slate-300 text-slate-500'}`}>
                                Reply to message
                              </div>
                            )}

                            {msg.attachment_url && (
                              <div className="mb-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-slate-800">
                                {msg.attachment_name?.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? (
                                  <img
                                    src={msg.attachment_url}
                                    alt="attachment"
                                    className="max-h-40 rounded-lg object-cover cursor-pointer hover:opacity-90 transition"
                                    onClick={() => window.open(msg.attachment_url, '_blank')}
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-blue-500 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[11px] font-bold text-slate-900">{msg.attachment_name}</p>
                                      <span className="text-[9px] text-slate-400">Document</span>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      {msg.attachment_name?.toLowerCase().endsWith('.pdf') && (
                                        <button
                                          onClick={() => setPdfPreviewUrl(msg.attachment_url)}
                                          className="rounded bg-blue-50 p-1 text-blue-600 hover:bg-blue-100"
                                        >
                                          <Eye size={12} />
                                        </button>
                                      )}
                                      <a
                                        href={msg.attachment_url}
                                        download
                                        className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
                                      >
                                        <Download size={12} />
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {(msg.content ?? msg.text)?.startsWith('[MEETING_CARD]') ? (
                              renderMeetingCard(msg.content ?? msg.text)
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.content ?? msg.text}</p>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-85">
                              <span className={mine ? 'text-blue-500' : 'text-slate-400'}>
                                {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.is_edited && (
                                <span className={mine ? 'text-blue-500' : 'text-slate-400'}>• Edited</span>
                              )}
                              {mine && (
                                <span>
                                  {msg.is_read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-slate-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {peerTyping && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400 shadow-xs animate-pulse">
                          typing...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {replyingTo && (
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-t border-blue-50 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Reply className="h-3.5 w-3.5" />
                    <span>Replying to: <strong>{replyingTo.content || replyingTo.text}</strong></span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-slate-100 p-4 bg-white shrink-0">
                {editingMessage ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 rounded-2xl border border-blue-50 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={submitEdit}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMessage(null)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${showQuickActions ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      onClick={() => setShowQuickActions(!showQuickActions)}
                    >
                      <Plus size={16} className={`transition duration-200 ${showQuickActions ? 'rotate-45' : ''}`} />
                    </button>
                    <div className="flex-1 flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-4 py-1.5 transition-all focus-within:border-blue-300 focus-within:bg-white">
                      <button className="text-slate-400 hover:text-slate-600 pr-2" onClick={() => handleUnavailableAction('Emoji')}>
                        <Smile size={18} />
                      </button>
                      <input
                        value={messageText}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                          handleInputKeyPress();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void sendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 border-none bg-transparent py-1 text-xs font-semibold outline-none text-slate-800 placeholder-slate-400"
                      />
                      <label className="text-slate-400 hover:text-slate-600 pl-2 cursor-pointer transition">
                        <Paperclip className="h-5 w-5" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => void sendMessage()}
                      disabled={!messageText.trim() || uploading}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:brightness-110 disabled:opacity-40 transition"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Column 3: Contact Details Sidebar */}
        {showDetails && selectedUser && (
          <aside className="hidden lg:flex w-[280px] flex-col border-l border-slate-100 bg-slate-50/10 shrink-0">
            <div className="p-6 text-center border-b border-slate-100 bg-white">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-black text-white shadow-md">
                {(selectedUser.name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <h4 className="mt-3 text-xs font-bold text-slate-900">{selectedUser.name}</h4>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-0.5">{selectedUser.role}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-1">{selectedUser.email}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 px-4 py-4 border-b border-slate-100 bg-white shrink-0">
              {[
                { label: 'Profile', icon: <User size={14} />, act: () => setShowProfileDrawer(true) },
                { label: 'Call', icon: <Phone size={14} />, act: () => handleUnavailableAction('Voice call') },
                { label: 'Meet', icon: <Video size={14} />, act: () => setShowVideoMeetModal(true) },
                { label: 'More', icon: <MoreVertical size={14} />, act: () => setShowMoreOptions(true) },
              ].map((btn, idx) => (
                <button key={idx} onClick={btn.act} className="flex flex-col items-center gap-1 hover:opacity-80 transition">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 shadow-xs">
                    {btn.icon}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{btn.label}</span>
                </button>
              ))}
            </div>

            <div className="p-4 border-b border-slate-100 bg-white shrink-0">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Search in Chat</label>
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={inChatSearch}
                  onChange={(e) => setInChatSearch(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full rounded-xl border border-slate-100 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>
            {inChatSearch.trim() && (
              <div className="px-4 pb-2 max-h-[140px] overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100/60 no-scrollbar mx-4 mb-2">
                {messages
                  .filter((m) => (m.content || m.text || '').toLowerCase().includes(inChatSearch.toLowerCase()))
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        const el = document.getElementById(`msg-${m.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          setHighlightedMessageId(m.id);
                          setTimeout(() => setHighlightedMessageId(null), 2000);
                          showToast('Message located', 'info');
                        }
                      }}
                      className="w-full text-left text-[10px] font-semibold text-slate-700 hover:text-blue-600 truncate block py-1 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-bold text-slate-400">{(m.sender_id === user.id) ? 'Me: ' : 'Them: '}</span>
                      {m.content || m.text}
                    </button>
                  ))}
                {messages.filter((m) => (m.content || m.text || '').toLowerCase().includes(inChatSearch.toLowerCase())).length === 0 && (
                  <p className="text-[9px] text-slate-400 text-center py-1">No matches found</p>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shared Files ({sharedFiles.length})</h5>
                  <button className="text-[9px] font-bold text-blue-600 hover:underline" onClick={() => setShowSharedFilesModal(true)}>View all</button>
                </div>
                <div className="space-y-2">
                  {sharedFiles.slice(0, 3).map((file) => (
                    <div key={file.id} className="flex items-center gap-2 rounded-xl bg-white p-2 border border-slate-100 shadow-xs">
                      <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold text-slate-800">{file.attachment_name}</p>
                        <span className="text-[9px] text-slate-400">Shared recently</span>
                      </div>
                      <a
                        href={file.attachment_url}
                        download
                        className="rounded p-1 text-slate-400 hover:bg-slate-50 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                  {sharedFiles.length === 0 && (
                    <p className="text-[10px] font-semibold text-slate-400 text-center py-2">No files shared yet</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Media</h5>
                  <button className="text-[9px] font-bold text-blue-600 hover:underline" onClick={() => setShowMediaGalleryModal(true)}>View all</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {sharedFiles
                    .filter(f => f.attachment_name?.toLowerCase().match(/\.(jpg|jpeg|png)$/))
                    .slice(0, 3)
                    .map((file) => (
                      <div key={file.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100 group cursor-pointer" onClick={() => setMediaLightboxUrl(file.attachment_url)}>
                        <img src={file.attachment_url} alt="media" className="h-full w-full object-cover group-hover:scale-105 transition duration-200" />
                      </div>
                    ))}
                </div>
                {sharedFiles.filter(f => f.attachment_name?.toLowerCase().match(/\.(jpg|jpeg|png)$/)).length === 0 && (
                  <p className="text-[10px] font-semibold text-slate-400 text-center py-2">No media shared yet</p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* PDF Modal Viewer */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-xs font-bold text-slate-900">PDF Document Viewer</h3>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe src={pdfPreviewUrl} className="h-full w-full" title="pdf-viewer" />
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900">Forward Message</h3>
              <button
                onClick={() => setForwardMessage(null)}
                className="rounded-full p-1.5 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
              {mergedList.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleForwardMessage(contact)}
                  className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left hover:bg-slate-50 transition"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-xs font-bold text-blue-700">
                    {(contact.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{contact.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">{contact.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl w-40"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {[
            {
              label: 'Reply',
              icon: Reply,
              act: () => setReplyingTo(contextMenu.message)
            },
            {
              label: 'Forward',
              icon: Forward,
              act: () => setForwardMessage(contextMenu.message)
            },
            {
              label: 'Copy',
              icon: Copy,
              act: () => {
                navigator.clipboard.writeText(contextMenu.message.content || contextMenu.message.text);
              }
            },
            ...(contextMenu.message.sender_id === user.id && !contextMenu.message.is_deleted
              ? [
                  {
                    label: 'Edit',
                    icon: Edit2,
                    act: () => {
                      setEditingMessage(contextMenu.message);
                      setEditText(contextMenu.message.content || contextMenu.message.text);
                    }
                  },
                  {
                    label: 'Delete',
                    icon: Trash2,
                    act: () => submitDelete(contextMenu.message.id)
                  }
                ]
              : [])
          ].map((action, actionIdx) => (
            <button
              key={actionIdx}
              onClick={action.act}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Profile Slide-over Drawer */}
      <AnimatePresence>
        {showProfileDrawer && selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileDrawer(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-sm border-l border-slate-100 bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0">
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">User Profile</h3>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white shadow-lg">
                    {(selectedUser.name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-slate-900">{selectedUser.name}</h4>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${selectedUser.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{selectedUser.online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contact Information</h5>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs font-semibold text-slate-750">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email</span>
                      <span className="text-slate-800 truncate max-w-[180px]">{selectedUser.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone</span>
                      <span className="text-slate-800">{selectedUser.phone || '9348532113'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Role</span>
                      <span className="text-slate-800 uppercase text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{selectedUser.role || 'User'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Seen</span>
                      <span className="text-slate-800">{selectedUser.online ? 'Just now' : selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString() : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                {selectedUser.role === 'PARENT' && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Details</h5>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs font-semibold text-slate-750">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Linked Student(s)</span>
                        <span className="text-slate-800">{selectedUser.students || 'Student Name'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Class & Section</span>
                        <span className="text-slate-800">{selectedUser.class_name || 'Class A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Institute Name</span>
                        <span className="text-slate-800 truncate max-w-[180px]">{institute?.name || user?.instituteName || 'Eddva Institute'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.role === 'TEACHER' && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Professional Details</h5>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs font-semibold text-slate-750">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subject(s) Taught</span>
                        <span className="text-slate-800">{selectedUser.subjects || 'Multiple Subjects'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Institute Name</span>
                        <span className="text-slate-800 truncate max-w-[180px]">{institute?.name || user?.instituteName || 'Eddva Institute'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quick Actions</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => {
                        setShowProfileDrawer(false);
                        const inp = document.querySelector('input[placeholder="Type a message..."]');
                        inp?.focus();
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Send size={12} className="text-blue-500" />
                      Send Message
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileDrawer(false);
                        setShowSharedFilesModal(true);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <FileText size={12} className="text-indigo-500" />
                      Shared Files
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Video Meet Creator Modal */}
      <AnimatePresence>
        {showVideoMeetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase">Schedule Video Meet</h3>
                <button
                  onClick={() => setShowVideoMeetModal(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <label className="text-slate-400">Meeting Title</label>
                  <input
                    type="text"
                    value={meetTitle}
                    onChange={(e) => setMeetTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Meeting Description</label>
                  <textarea
                    value={meetDesc}
                    onChange={(e) => setMeetDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Meeting Date</label>
                    <input
                      type="date"
                      value={meetDate}
                      onChange={(e) => setMeetDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Start Time</label>
                    <input
                      type="time"
                      value={meetTime}
                      onChange={(e) => setMeetTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Duration</label>
                  <select
                    value={meetDuration}
                    onChange={(e) => setMeetDuration(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                  >
                    <option value="15 mins">15 mins</option>
                    <option value="30 mins">30 mins</option>
                    <option value="60 mins">60 mins</option>
                    <option value="90 mins">90 mins</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={async () => {
                    const roomUrl = `https://meet.eddva.com/room/${Math.random().toString(36).substring(2, 11)}`;
                    const formattedInvite = `[MEETING_CARD]|${meetTitle}|${meetDate} ${meetTime}|${meetDuration}|${meetDesc}|${roomUrl}`;
                    
                    try {
                      const res = await api.post('/chat/messages', {
                        receiverId: selectedUser.id,
                        content: formattedInvite
                      });
                      const created = res.data?.data;
                      if (created) {
                        setMessages((prev) => {
                          if (prev.some(m => String(m.id) === String(created.id))) return prev;
                          return [...prev, created];
                        });
                      }
                      setShowVideoMeetModal(false);
                      showToast('Meeting invitation card sent!', 'success');
                    } catch (err) {
                      showToast('Failed to send meeting invitation', 'error');
                    }
                  }}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  Start Meeting
                </button>
                <button
                  onClick={() => {
                    setShowVideoMeetModal(false);
                    showToast('Meeting scheduled successfully!', 'success');
                  }}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                >
                  Schedule Only
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* More Options Settings Modal */}
      <AnimatePresence>
        {showMoreOptions && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase">Conversation Settings</h3>
                <button
                  onClick={() => setShowMoreOptions(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Actions</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleExportChat}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"
                    >
                      <Download size={14} className="text-blue-500" /> Export Chat History
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreOptions(false);
                        window.print();
                      }}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"
                    >
                      <FileText size={14} className="text-slate-500" /> Print Conversation
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Preferences</span>
                  <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-600">Mute Notifications</span>
                      <button
                        onClick={() => {
                          setMutedChats((prev) => ({ ...prev, [selectedUser.id]: !prev[selectedUser.id] }));
                          showToast(mutedChats[selectedUser.id] ? 'Notifications unmuted' : 'Notifications muted', 'success');
                        }}
                        className={`rounded-full px-3 py-1 font-bold text-[10px] transition ${
                          mutedChats[selectedUser.id] ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {mutedChats[selectedUser.id] ? 'Muted' : 'Mute'}
                      </button>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-t border-slate-100/60">
                      <span className="text-slate-600">Archive Conversation</span>
                      <button
                        onClick={() => {
                          setArchivedChats((prev) => ({ ...prev, [selectedUser.id]: !prev[selectedUser.id] }));
                          showToast(archivedChats[selectedUser.id] ? 'Conversation unarchived' : 'Conversation archived', 'success');
                        }}
                        className={`rounded-full px-3 py-1 font-bold text-[10px] transition ${
                          archivedChats[selectedUser.id] ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {archivedChats[selectedUser.id] ? 'Archived' : 'Archive'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Danger Zone</span>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (confirm('Permanently delete all messages? This cannot be undone.')) {
                          setMessages([]);
                          setShowMoreOptions(false);
                          showToast('Chat history cleared', 'success');
                        }
                      }}
                      className="w-full flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/20 p-2.5 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <span>Clear Conversation History</span>
                      <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-700 px-2 py-0.5 rounded">Delete</span>
                    </button>
                    <button
                      onClick={() => {
                        setBlockedChats((prev) => ({ ...prev, [selectedUser.id]: !prev[selectedUser.id] }));
                        setShowMoreOptions(false);
                        showToast(blockedChats[selectedUser.id] ? 'Contact unblocked' : 'Contact blocked successfully', 'success');
                      }}
                      className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 hover:bg-slate-50 transition"
                    >
                      <span>{blockedChats[selectedUser.id] ? 'Unblock Contact' : 'Block Contact'}</span>
                      <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Block</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shared Files Viewer Modal */}
      <AnimatePresence>
        {showSharedFilesModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl flex flex-col h-[70vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
                <h3 className="text-sm font-black text-slate-900 uppercase">Shared Documents ({sharedFiles.length})</h3>
                <button
                  onClick={() => setShowSharedFilesModal(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-slate-700">
                {sharedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-3 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-slate-800">{file.attachment_name}</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5 font-bold">Shared recently</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {file.attachment_name?.toLowerCase().endsWith('.pdf') && (
                        <button
                          onClick={() => {
                            setPdfPreviewUrl(file.attachment_url);
                            setShowSharedFilesModal(false);
                          }}
                          className="rounded-xl bg-blue-50 p-2 text-xs font-bold text-blue-600 hover:bg-blue-100 transition"
                        >
                          Preview
                        </button>
                      )}
                      <a
                        href={file.attachment_url}
                        download
                        className="rounded-xl bg-slate-100 p-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}

                {sharedFiles.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <FileText size={32} className="opacity-40 mb-2" />
                    <p className="text-xs font-bold">No documents shared in this conversation</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Gallery Lightbox Modal */}
      <AnimatePresence>
        {showMediaGalleryModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl flex flex-col h-[75vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
                <h3 className="text-sm font-black text-slate-900 uppercase">Shared Media</h3>
                <button
                  onClick={() => setShowMediaGalleryModal(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3">
                {sharedFiles
                  .filter(f => f.attachment_name?.toLowerCase().match(/\.(jpg|jpeg|png)$/))
                  .map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setMediaLightboxUrl(file.attachment_url)}
                      className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group cursor-pointer shadow-xs hover:shadow-md transition"
                    >
                      <img src={file.attachment_url} alt="gallery" className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Eye size={20} className="text-white" />
                      </div>
                    </div>
                  ))}

                {sharedFiles.filter(f => f.attachment_name?.toLowerCase().match(/\.(jpg|jpeg|png)$/)).length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center h-full text-slate-400">
                    <Smile size={32} className="opacity-40 mb-2" />
                    <p className="text-xs font-bold">No images or media shared in this conversation</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-screen Media Lightbox Viewer */}
      <AnimatePresence>
        {mediaLightboxUrl && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 p-4">
            <button
              onClick={() => setMediaLightboxUrl(null)}
              className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            >
              <X size={20} />
            </button>
            <img
              src={mediaLightboxUrl}
              alt="lightbox"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-4 flex gap-3">
              <a
                href={mediaLightboxUrl}
                download
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-blue-700 transition"
              >
                <Download size={14} /> Download Image
              </a>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Actions Panel */}
      <AnimatePresence>
        {showQuickActions && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowQuickActions(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-4 z-50 w-56 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-2xl space-y-2 text-xs font-semibold text-slate-700 animate-in fade-in duration-100"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-2">Communication</span>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    const el = document.querySelector('input[placeholder="Search messages..."]');
                    el?.focus();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition text-left"
                >
                  <Search size={14} /> Search Messages
                </button>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    setShowMediaGalleryModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition text-left"
                >
                  <Smile size={14} /> View Media Gallery
                </button>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    setShowSharedFilesModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition text-left"
                >
                  <FileText size={14} /> View Shared Documents
                </button>
              </div>

              <div className="border-t border-slate-100 my-1 pt-1 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-2">Conversation</span>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    if (selectedUser) {
                      setPinnedChats((prev) => ({ ...prev, [selectedUser.id]: !prev[selectedUser.id] }));
                      showToast(pinnedChats[selectedUser.id] ? 'Conversation unpinned' : 'Conversation pinned', 'success');
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition text-left"
                >
                  <Plus size={14} /> {selectedUser && pinnedChats[selectedUser.id] ? 'Unpin Conversation' : 'Pin Conversation'}
                </button>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    if (selectedUser) {
                      setMutedChats((prev) => ({ ...prev, [selectedUser.id]: !prev[selectedUser.id] }));
                      showToast(mutedChats[selectedUser.id] ? 'Notifications unmuted' : 'Notifications muted', 'success');
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-rose-50 hover:text-rose-600 transition text-left"
                >
                  <Clock size={14} /> {selectedUser && mutedChats[selectedUser.id] ? 'Unmute' : 'Mute Notifications'}
                </button>
              </div>

              <div className="border-t border-slate-100 my-1 pt-1 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-2">Admin Actions</span>
                <button
                  onClick={() => { setShowQuickActions(false); showToast('User settings loaded', 'info'); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition text-left"
                >
                  <User size={14} /> User Settings
                </button>
                <button
                  onClick={() => { setShowQuickActions(false); showToast('System audit logs fetched', 'info'); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition text-left"
                >
                  <FileText size={14} /> View Audit Logs
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification Stream */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl ${
              t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
