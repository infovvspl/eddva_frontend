import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Users,
  User,
  Headphones,
  Smile,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Eye,
  Download,
  Trash2,
  Edit2,
  Reply as ReplyIcon,
  Forward,
  Copy,
  Info,
  Clock,
  Check,
  CheckCheck,
  X,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Search
} from 'lucide-react';
import SearchBar from '@/components/school/SearchBar';
import Tabs from '@/components/school/Tabs';
import api from '@/lib/api/school-client';
import { createChatSocket } from '@/lib/chat-socket';
import { useAuth } from '@/context/SchoolAuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import { getUploadUrl, uploadToS3 } from '@/lib/upload';
import './ChatSystem.css';

type Contact = {
  id: string;
  name: string;
  email?: string;
  online: boolean;
  time: string;
  lastMessage: string;
  unread: number;
};

type ChatMessage = {
  id: string | number;
  text: string;
  time: string;
  sender: 'me' | 'other';
  is_edited?: boolean;
  is_deleted?: boolean;
  is_forwarded?: boolean;
  is_read?: boolean;
  parent_message_id?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at?: string;
};

type DirectoryRow = {
  class_name: string;
  section_name: string;
  parent_name: string;
  parent_phone: string;
  student_name: string;
  parent_id?: string;
  parent_name_user?: string;
  parent_email?: string;
};

const ROLE_BY_TAB: Record<string, string> = {
  parents: 'PARENT',
  staff: 'INSTITUTE_ADMIN',
};

const ChatSystem: React.FC = () => {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<string>('parents');
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Track active chat peer ID
  useEffect(() => {
    (window as any).activeChatPeerId = activeContact?.id || null;
    return () => {
      (window as any).activeChatPeerId = null;
    };
  }, [activeContact]);

  // Handle userId query parameter on load/change
  useEffect(() => {
    const userIdParam = new URLSearchParams(window.location.search).get('userId');
    if (!userIdParam || contacts.length === 0) return;

    const contact = contacts.find((c) => String(c.id) === String(userIdParam));
    if (contact) {
      if (!activeContact || String(activeContact.id) !== String(userIdParam)) {
        openConversation(contact);
      }
    } else {
      // Not found in current tab's contacts. Let's check other tabs!
      const checkOtherTabs = async () => {
        const tabs = ['parents', 'staff'];
        for (const t of tabs) {
          if (t === activeTab) continue;
          try {
            const role = ROLE_BY_TAB[t] ?? 'PARENT';
            const groupContacts = await fetchGroup(role);
            const found = groupContacts.find((c) => String(c.id) === String(userIdParam));
            if (found) {
              setActiveTab(t);
              setContacts(groupContacts);
              openConversation(found);
              break;
            }
          } catch (e) {
            console.error("Error finding contact in other tabs:", e);
          }
        }
      };
      void checkOtherTabs();
    }
  }, [contacts, activeTab]);

  const [loadingContacts, setLoadingContacts] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 3-Column Layout: Details Panel toggle
  const [showDetails, setShowDetails] = useState(true);

  // Message Action States
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: ChatMessage } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [uploading, setUploading] = useState(false);

  // Attachments View
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Grouped Parent Directory
  const [directoryData, setDirectoryData] = useState<DirectoryRow[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Typing indicators
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socketRef = useRef<any>(null);

  // Premium Interactive Workflows States
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showVideoMeetModal, setShowVideoMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('Discussion on Student Progress');
  const [meetDesc, setMeetDesc] = useState('Reviewing classroom schedule, assignments, and curriculum outline.');
  const [meetDuration, setMeetDuration] = useState('30 mins');
  const [meetDate, setMeetDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetTime, setMeetTime] = useState('14:00');
  const [meetMode, setMeetMode] = useState<'online' | 'offline'>('online');
  const [meetPlatform, setMeetPlatform] = useState('Google Meet');
  const [meetLink, setMeetLink] = useState('');
  const [meetLocation, setMeetLocation] = useState('');
  const [meetingInbox, setMeetingInbox] = useState<any[]>([]);
  const [loadingMeetingInbox, setLoadingMeetingInbox] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showSharedFilesModal, setShowSharedFilesModal] = useState(false);
  const [showMediaGalleryModal, setShowMediaGalleryModal] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | number | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({});
  const [starredMessages, setStarredMessages] = useState<Record<string, boolean>>({});
  const [mutedChats, setMutedChats] = useState<Record<string, boolean>>({});
  const [archivedChats, setArchivedChats] = useState<Record<string, boolean>>({});
  const [blockedChats, setBlockedChats] = useState<Record<string, boolean>>({});
  const [mediaLightboxUrl, setMediaLightboxUrl] = useState<string | null>(null);

  // Simple custom toast trigger
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message: msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleExportChat = () => {
    if (!activeContact) return;
    const chatLog = messages
      .map((m) => `[${m.time}] ${m.sender === 'me' ? 'Me' : activeContact.name}: ${m.text}`)
      .join('\n');
    const blob = new Blob([chatLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_history_${activeContact.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    showToast('Chat history exported successfully', 'success');
  };

  const handleUnavailableAction = (action: string) => {
    showToast(`${action} action triggered (Simulated)`, 'info');
  };

  const fetchGroup = useCallback(async (role: string): Promise<Contact[]> => {
    const [usersRes, convRes] = await Promise.all([
      api.get('/chat/users', { params: { role } }),
      api.get('/chat/conversations', { params: { role } }),
    ]);
    const usersList: any[] = usersRes.data?.data ?? [];
    const conversations: any[] = convRes.data?.data ?? [];
    const convByPeer = new Map<string, any>();
    conversations.forEach((c) => convByPeer.set(c.peer_id, c));

    return usersList
      .filter((u) => u.id !== user?.id)
      .map((u) => {
        const conv = convByPeer.get(u.id);
        return {
          id: u.id,
          name: u.name || 'Unknown',
          email: u.email,
          online: u.online ?? false,
          time: conv?.created_at ? new Date(conv.created_at).toLocaleDateString() : '',
          lastMessage: conv?.last_message || 'No messages yet',
          unread: Number(conv?.unread_count || 0),
        };
      });
  }, [user?.id]);

  const loadActiveTab = useCallback(
    async (showSpinner = false) => {
      if (activeTab === 'directory') {
        void fetchDirectory();
        return;
      }
      const role = ROLE_BY_TAB[activeTab] ?? 'PARENT';
      if (showSpinner) setLoadingContacts(true);
      try {
        setContacts(await fetchGroup(role));
      } catch (err) {
        console.error(`Failed to load ${role} contacts`, err);
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    },
    [activeTab, fetchGroup],
  );

  async function fetchDirectory() {
    setLoadingDirectory(true);
    try {
      const res = await api.get('/chat/directory');
      setDirectoryData(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load grouped directory", err);
    } finally {
      setLoadingDirectory(false);
    }
  }

  useEffect(() => {
    void loadActiveTab(true);
  }, [loadActiveTab]);

  const loadMeetingInbox = useCallback(async () => {
    setLoadingMeetingInbox(true);
    try {
      const res = await api.get('/meetings');
      const payload = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setMeetingInbox(payload);
    } catch (err) {
      console.error('Failed to load teacher meetings', err);
      setMeetingInbox([]);
    } finally {
      setLoadingMeetingInbox(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetingInbox();
  }, [loadMeetingInbox]);

  const fetchMessages = useCallback(async (peerId: string) => {
    try {
      const res = await api.get(`/chat/messages/${peerId}`);
      const list: any[] = res.data?.data ?? [];
      setMessages(
        list.map((m) => ({
          id: m.id,
          text: m.content ?? m.text,
          time: m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          sender: m.sender_id === user?.id ? 'me' : 'other',
          is_edited: m.is_edited,
          is_deleted: m.is_deleted,
          is_forwarded: m.is_forwarded,
          is_read: m.is_read,
          parent_message_id: m.parent_message_id,
          attachment_url: m.attachment_url,
          attachment_name: m.attachment_name,
          created_at: m.created_at
        })),
      );
    } catch (err) {
      console.error('Failed to load messages', err);
      setMessages([]);
    }
  }, [user?.id]);

  const openConversation = (contact: Contact) => {
    setActiveContact(contact);
    void fetchMessages(contact.id);
    setReplyingTo(null);
    setEditingMessage(null);
    setInChatSearch('');
    api.patch(`/chat/messages/${contact.id}/read`).catch(() => { });
  };

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, peerTyping]);

  // Realtime Connection Setup
  useEffect(() => {
    if (!user?.id) return;
    const socket = createChatSocket();
    socketRef.current = socket;

    const join = () => socket.emit('join_user', user.id);
    socket.on('connect', () => { join(); setSocketConnected(true); });
    socket.on('disconnect', () => setSocketConnected(false));
    join();

    socket.on('direct_message', (msg: any) => {
      const peer = activeContact;
      if (peer && (msg.sender_id === peer.id || msg.receiver_id === peer.id)) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(msg.id))) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              text: msg.content ?? msg.text,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: msg.sender_id === user.id ? 'me' : 'other',
              is_edited: msg.is_edited,
              is_deleted: msg.is_deleted,
              is_forwarded: msg.is_forwarded,
              is_read: msg.is_read,
              parent_message_id: msg.parent_message_id,
              attachment_url: msg.attachment_url,
              attachment_name: msg.attachment_name,
              created_at: msg.created_at
            }
          ];
        });
        api.patch(`/chat/messages/${peer.id}/read`).catch(() => { });
      }
      void loadActiveTab(false);
    });

    socket.on('message_updated', (msg: any) => {
      const peer = activeContact;
      if (peer && (msg.sender_id === peer.id || msg.receiver_id === peer.id)) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, text: msg.text, is_edited: msg.is_edited, is_deleted: msg.is_deleted } : m))
        );
      }
      void loadActiveTab(false);
    });

    socket.on('presence_change', (data: any) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === data.userId ? { ...c, online: data.status === 'online' } : c))
      );
      setActiveContact((prev) => {
        if (prev && prev.id === data.userId) {
          return { ...prev, online: data.status === 'online' };
        }
        return prev;
      });
    });

    socket.on('typing', (data: any) => {
      if (activeContact && data.senderId === activeContact.id) {
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
  }, [user?.id, activeContact, loadActiveTab]);

  // Typing emitter
  function handleInputKeyPress() {
    if (socketRef.current && activeContact) {
      socketRef.current.emit('typing', {
        roomId: activeContact.id,
        isTyping: true,
        receiverId: activeContact.id,
      });
    }
  }

  // File Upload Attachment Handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;
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
        receiverId: activeContact.id,
        content: `Sent an attachment: ${file.name}`,
        attachmentUrl: presign.fileUrl,
        attachmentName: file.name,
      });
      const created = res.data?.data;
      if (created) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(created.id))) return prev;
          return [
            ...prev,
            {
              id: created.id,
              text: created.content ?? created.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: 'me',
              attachment_url: created.attachment_url,
              attachment_name: created.attachment_name,
              created_at: created.created_at
            }
          ];
        });
      }
      void loadActiveTab(false);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  }

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || !activeContact) return;
    setMessage('');
    try {
      const res = await api.post('/chat/messages', {
        receiverId: activeContact.id,
        content: trimmed,
        parentMessageId: replyingTo?.id || null
      });
      const created = res.data?.data;
      if (created) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(created.id))) return prev;
          return [
            ...prev,
            {
              id: created.id,
              text: created.content ?? created.text ?? trimmed,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: 'me',
              parent_message_id: created.parent_message_id,
              created_at: created.created_at
            }
          ];
        });
      }
      setReplyingTo(null);
      void loadActiveTab(false);
    } catch (err) {
      console.error('Failed to send message', err);
      window.alert('Failed to send message');
      setMessage(trimmed);
    }
  };

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
          prev.map((m) => (m.id === updated.id ? { ...m, text: updated.text, is_edited: updated.is_edited } : m))
        );
      }
      setEditingMessage(null);
    } catch (err) {
      alert("Failed to edit message");
    }
  }

  async function submitDelete(messageId: string | number) {
    const isConfirmed = await confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this message? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel"
    });
    if (!isConfirmed) return;
    try {
      const res = await api.delete(`/chat/messages/${messageId}`);
      const updated = res.data?.data;
      if (updated) {
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? { ...m, text: updated.text, is_deleted: updated.is_deleted } : m))
        );
      }
    } catch (err) {
      alert("Failed to delete message");
    }
  }

  function handleForwardMessage(contact: Contact) {
    if (!forwardMessage) return;
    api.post('/chat/messages', {
      receiverId: contact.id,
      content: forwardMessage.text,
      isForwarded: true,
      attachmentUrl: forwardMessage.attachment_url,
      attachmentName: forwardMessage.attachment_name,
    }).then(() => {
      setForwardMessage(null);
      alert(`Message forwarded to ${contact.name}`);
      void loadActiveTab(false);
    }).catch(() => {
      alert("Failed to forward message");
    });
  }

  // Right-click context menu helper
  function handleContextMenu(e: React.MouseEvent, msg: ChatMessage) {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message: msg
    });
  }

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Shared Files / Attachments extraction
  const sharedFiles = useMemo(() => {
    return messages.filter((m) => m.attachment_url);
  }, [messages]);

  // Message date separation & search filters
  const filteredMessages = useMemo(() => {
    if (!inChatSearch.trim()) return messages;
    return messages.filter((m) =>
      (m.text || '').toLowerCase().includes(inChatSearch.toLowerCase())
    );
  }, [messages, inChatSearch]);

  function getMessageGroupLabel(dateStr?: string) {
    if (!dateStr) return 'Today';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const groupedMessages = useMemo(() => {
    const groups: Array<{ type: 'separator'; label: string } | { type: 'message'; data: ChatMessage }> = [];
    let lastLabel = '';
    filteredMessages.forEach((msg) => {
      const label = getMessageGroupLabel(msg.created_at);
      if (label !== lastLabel) {
        groups.push({ type: 'separator', label });
        lastLabel = label;
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  }, [filteredMessages]);

  // Grouped Parent Directory UI structure
  const groupedDirectory = useMemo(() => {
    const map: Record<string, Record<string, DirectoryRow[]>> = {};
    directoryData.forEach((row) => {
      if (!map[row.class_name]) map[row.class_name] = {};
      if (!map[row.class_name][row.section_name]) map[row.class_name][row.section_name] = [];
      map[row.class_name][row.section_name].push(row);
    });
    return map;
  }, [directoryData]);

  const toggleClass = (cls: string) => {
    setExpandedClasses((prev) => ({ ...prev, [cls]: !prev[cls] }));
  };

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };
  const contactDirectoryInfo = useMemo(() => {
    if (!activeContact) return null;
    return directoryData.find(d => d.parent_id === activeContact.id);
  }, [activeContact, directoryData]);

  const contactSub = useMemo(() => {
    if (!activeContact) return '';
    if (contactDirectoryInfo) {
      return `${contactDirectoryInfo.class_name} • Section ${contactDirectoryInfo.section_name}`;
    }
    return activeTab === 'parents' ? 'Parent' : 'Staff';
  }, [activeContact, contactDirectoryInfo, activeTab]);

  function startChatFromDirectory(row: DirectoryRow) {
    if (!row.parent_id) {
      alert("No active parent account mapped to this student yet.");
      return;
    }
    const contact: Contact = {
      id: row.parent_id,
      name: row.parent_name_user || row.parent_name,
      email: row.parent_email,
      online: false,
      time: '',
      lastMessage: '',
      unread: 0
    };
    setActiveTab('parents');
    openConversation(contact);
  }

  const renderParentDirectory = () => {
    if (loadingDirectory) {
      return <div className="p-4 text-center text-xs font-bold text-slate-400">Loading parent directory...</div>;
    }
    if (directoryData.length === 0) {
      return <div className="p-4 text-center text-xs font-bold text-slate-400">No assigned classes/sections found.</div>;
    }
    return (
      <div className="chat__contacts p-3 space-y-3 max-h-[50vh] overflow-y-auto bg-slate-50/20 rounded-2xl border border-slate-100">
        {Object.entries(groupedDirectory).map(([className, sections]) => {
          const isClassExpanded = expandedClasses[className];
          return (
            <div key={className} className="space-y-1">
              <button
                onClick={() => toggleClass(className)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-blue-50 text-left text-xs font-bold text-slate-800"
              >
                <span>Class: {className}</span>
                {isClassExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isClassExpanded && (
                <div className="pl-3 space-y-1">
                  {Object.entries(sections).map(([sectionName, students]) => {
                    const isSecExpanded = expandedSections[`${className}-${sectionName}`];
                    return (
                      <div key={sectionName} className="space-y-1">
                        <button
                          onClick={() => toggleSection(`${className}-${sectionName}`)}
                          className="w-full flex items-center justify-between p-1.5 rounded-lg bg-blue-50/40 text-left text-[11px] font-black text-slate-600"
                        >
                          <span>Section: {sectionName}</span>
                          {isSecExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        {isSecExpanded && (
                          <div className="pl-2 space-y-1.5">
                            {students.map((student, studentIdx) => (
                              <div
                                key={studentIdx}
                                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-sm"
                              >
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-slate-800 truncate">Student: {student.student_name}</p>
                                  <p className="text-[10px] font-medium text-slate-400 truncate">Parent: {student.parent_name_user || student.parent_name}</p>
                                </div>
                                <button
                                  disabled={!student.parent_id}
                                  onClick={() => startChatFromDirectory(student)}
                                  className="rounded-lg bg-blue-600 p-1.5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700"
                                >
                                  <Send size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderContactList = (list: Contact[]) => {
    if (loadingContacts) {
      return (
        <div className="p-3 space-y-2">
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
      );
    }
    const filtered = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center opacity-65">
          <Users size={32} className="text-slate-350 mb-2" />
          <p className="text-xs font-bold text-slate-500">No contacts found</p>
        </div>
      );
    }
    return (
      <div className="p-2 space-y-1">
        {filtered.map((contact) => {
          const active = activeContact?.id === contact.id;
          return (
            <button
              key={contact.id}
              onClick={() => openConversation(contact)}
              className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${active
                  ? "bg-blue-50/80 border border-blue-100/50 shadow-xs"
                  : "hover:bg-slate-50/60 border border-transparent"
                }`}
            >
              <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm">
                {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                {contact.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate">{contact.name}</span>
                  <span className="text-[9px] font-semibold text-slate-400 shrink-0">{contact.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] font-semibold text-slate-500 truncate">{contact.lastMessage}</p>
                  {contact.unread > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMeetingInbox = () => {
    const visibleMeetings = meetingInbox.slice(0, 4);
    return (
      <div className="p-3 pb-0">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Meeting Inbox</h4>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">
              {meetingInbox.length}
            </span>
          </div>
          {loadingMeetingInbox ? (
            <p className="text-[11px] font-semibold text-slate-400">Loading meetings...</p>
          ) : visibleMeetings.length === 0 ? (
            <p className="text-[11px] font-semibold text-slate-400">No meeting requests yet.</p>
          ) : (
            <div className="space-y-2">
              {visibleMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-slate-800">{meeting.title}</p>
                      <p className="truncate text-[10px] font-semibold text-slate-500">
                        {meeting.counterpartName} • {meeting.meetingDate || 'Date TBD'} {meeting.startTime ? `• ${meeting.startTime}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${meeting.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                      {meeting.status}
                    </span>
                  </div>
                  {meeting.status === 'pending' && meeting.isIncoming && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={async () => {
                          await api.patch(`/meetings/${meeting.id}/status`, { status: 'accepted' });
                          await loadMeetingInbox();
                          showToast('Meeting accepted', 'success');
                        }}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white"
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          await api.patch(`/meetings/${meeting.id}/status`, { status: 'rejected' });
                          await loadMeetingInbox();
                          showToast('Meeting rejected', 'info');
                        }}
                        className="rounded-lg bg-red-100 px-2.5 py-1 text-[10px] font-black text-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {['accepted', 'scheduled'].includes(meeting.status) && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={async () => {
                          await api.patch(`/meetings/${meeting.id}/status`, { status: 'completed' });
                          await loadMeetingInbox();
                          showToast('Meeting completed', 'success');
                        }}
                        className="rounded-lg bg-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700 hover:bg-blue-200 transition"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMeetingCard = (text: string) => {
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
    <div className="h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)] min-h-0 rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden flex flex-col md:flex-row relative">

      {/* Column 1: Sidebar Directory */}
      <div className={`w-full md:w-[300px] lg:w-[340px] border-r border-slate-100 flex flex-col shrink-0 min-h-0 bg-slate-50/10 transition-all ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100/60 bg-white shrink-0">
          <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Messages</h3>
          <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition" type="button" onClick={() => handleUnavailableAction('Chat options')}>
            <MoreVertical size={16} />
          </button>
        </div>
        <div className="p-3 bg-white">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Custom Tab Pills */}
        <div className="flex gap-1.5 px-3 py-2 bg-slate-50/50 overflow-x-auto no-scrollbar border-b border-slate-100/60">
          {[
            { id: 'parents', label: 'Parents', icon: <User size={12} /> },
            { id: 'staff', label: 'Staff', icon: <Headphones size={12} /> },
            { id: 'directory', label: 'Directory', icon: <Users size={12} /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition whitespace-nowrap ${active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'directory' ? renderParentDirectory() : renderContactList(contacts)}
        </div>
      </div>

      {/* Column 2: Chat Conversation Panel */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-white ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Conversation Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0 shadow-xs z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 text-slate-500" onClick={() => setActiveContact(null)}>
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm">
                  {activeContact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  {activeContact.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">{activeContact.name}</span>
                    {activeContact.online && (
                      <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{contactSub}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => handleUnavailableAction('Search in chat')} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition">
                  <Search size={16} />
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`p-2 rounded-xl transition ${showDetails ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  <Info size={16} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-slate-50/20 p-4 space-y-4">
              {groupedMessages.length > 0 ? (
                groupedMessages.map((item, idx) => {
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
                  const mine = msg.sender === 'me';

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'} transition-all duration-500 rounded-2xl ${highlightedMessageId === msg.id ? 'bg-amber-100 p-2 shadow-sm' : ''
                        }`}
                      onContextMenu={(e) => handleContextMenu(e, msg)}
                    >
                      <div
                        className={`group relative max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-xs transition duration-200 ${mine
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

                        {/* Attachments rendering */}
                        {msg.attachment_url && (
                          <div className="mb-2 rounded-xl bg-slate-50/60 p-2 border border-slate-100 text-slate-800">
                            {msg.attachment_name?.toLowerCase().match(/\.(jpg|jpeg|png)$/) ? (
                              <img
                                src={msg.attachment_url}
                                alt="attachment"
                                className="max-h-40 rounded-lg object-cover cursor-pointer hover:opacity-90 transition"
                                onClick={() => window.open(msg.attachment_url, '_blank')}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <FileText size={24} className="text-blue-500 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-bold text-slate-900">{msg.attachment_name}</p>
                                  <span className="text-[9px] text-slate-400">Document</span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {msg.attachment_name?.toLowerCase().endsWith('.pdf') && (
                                    <button
                                      onClick={() => setPdfPreviewUrl(msg.attachment_url!)}
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

                        {msg.text?.startsWith('[MEETING_CARD]') ? (
                          renderMeetingCard(msg.text)
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        )}

                        <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-85">
                          <span className={mine ? 'text-blue-500' : 'text-slate-400'}>{msg.time}</span>
                          {msg.is_edited && <span className={mine ? 'text-blue-500' : 'text-slate-400'}>• Edited</span>}
                          {mine && (
                            <span>
                              {msg.is_read ? (
                                <CheckCheck size={12} className="text-blue-600" />
                              ) : (
                                <Check size={12} className="text-slate-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                  <Users size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">No messages yet. Send a message to start!</p>
                </div>
              )}

              {peerTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-2 text-xs font-semibold text-slate-400 shadow-xs animate-pulse">
                    typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Banner */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-t border-blue-50 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <ReplyIcon size={12} />
                  <span>Replying to: <strong>{replyingTo.text}</strong></span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Composer Panel */}
            <div className="border-t border-slate-100 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pt-4 bg-white flex items-center gap-2 shrink-0 z-10">
              {editingMessage ? (
                <div className="flex w-full gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 rounded-2xl border border-blue-50 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-400"
                  />
                  <button onClick={submitEdit} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition">Save</button>
                  <button onClick={() => setEditingMessage(null)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
                </div>
              ) : (
                <>
                  <button className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${showQuickActions ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`} onClick={() => setShowQuickActions(!showQuickActions)}>
                    <Plus size={16} className={`transition duration-200 ${showQuickActions ? 'rotate-45' : ''}`} />
                  </button>
                  <div className="flex-1 flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-4 py-1.5 transition-all focus-within:border-blue-300 focus-within:bg-white">
                    <button className="text-slate-400 hover:text-slate-600 pr-2" onClick={() => handleUnavailableAction('Emoji')}>
                      <Smile size={18} />
                    </button>
                    <input
                      type="text"
                      className="flex-1 border-none bg-transparent py-1 text-xs font-semibold outline-none text-slate-800 placeholder-slate-400"
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        handleInputKeyPress();
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <label className="text-slate-400 hover:text-slate-600 pl-2 cursor-pointer transition">
                      <Paperclip size={18} />
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <button
                    disabled={!message.trim() || uploading}
                    onClick={handleSendMessage}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:brightness-110 disabled:opacity-40 transition"
                  >
                    <Send size={14} />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 opacity-60">
            <Users size={40} className="text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Select a conversation</h3>
            <p className="text-xs text-slate-400">Choose a contact or use the Directory to start messaging</p>
          </div>
        )}
      </div>

      {/* Column 3: Contact Details Side Panel */}
      {showDetails && activeContact && (
        <aside className="hidden xl:flex w-[280px] flex-col border-l border-slate-100 bg-slate-50/10 shrink-0">
          <div className="p-6 text-center border-b border-slate-100 bg-white shrink-0">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-black text-white shadow-md">
              {activeContact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <h4 className="mt-3 text-xs font-bold text-slate-900">{activeContact.name}</h4>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-0.5">{contactSub}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 px-4 py-4 border-b border-slate-100 bg-white shrink-0 lg:grid-cols-4">
            {[
              { label: 'Profile', icon: <User size={14} />, act: () => setShowProfileDrawer(true) },
              { label: 'Shared Files', icon: <FileText size={14} />, act: () => setShowSharedFilesModal(true) },
              { label: 'Info', icon: <Info size={14} />, act: () => setShowDetails(true) },
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

          <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">About</h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-700 truncate max-w-[160px]">{activeContact.email || 'N/A'}</span>
              </div>
              {contactDirectoryInfo && (
                <>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Class</span>
                    <span className="text-slate-700">{contactDirectoryInfo.class_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Section</span>
                    <span className="text-slate-700">{contactDirectoryInfo.section_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Student</span>
                    <span className="text-slate-700">{contactDirectoryInfo.student_name}</span>
                  </div>
                </>
              )}
            </div>
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
            {inChatSearch.trim() && (
              <div className="mt-2 max-h-[140px] overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100/60 no-scrollbar">
                {messages
                  .filter((m) => (m.text || '').toLowerCase().includes(inChatSearch.toLowerCase()))
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
                      <span className="font-bold text-slate-400">{m.sender === 'me' ? 'Me: ' : 'Them: '}</span>
                      {m.text}
                    </button>
                  ))}
                {messages.filter((m) => (m.text || '').toLowerCase().includes(inChatSearch.toLowerCase())).length === 0 && (
                  <p className="text-[9px] text-slate-400 text-center py-1">No matches found</p>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shared Files ({sharedFiles.length})</h5>
                <button className="text-[9px] font-bold text-blue-600 hover:underline" onClick={() => setShowSharedFilesModal(true)}>View all</button>
              </div>
              <div className="space-y-2">
                {sharedFiles.slice(0, 3).map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-xl bg-white p-2 border border-slate-100 shadow-xs">
                    <FileText size={18} className="text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold text-slate-800">{file.attachment_name}</p>
                      <span className="text-[9px] text-slate-400">Shared recently</span>
                    </div>
                    <a
                      href={file.attachment_url}
                      download
                      className="rounded p-1 text-slate-400 hover:bg-slate-50"
                    >
                      <Download size={12} />
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
                    <div key={file.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100 group cursor-pointer" onClick={() => window.open(file.attachment_url, '_blank')}>
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

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl w-40"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {[
            {
              label: 'Reply',
              icon: ReplyIcon,
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
                navigator.clipboard.writeText(contextMenu.message.text);
              }
            },
            ...(contextMenu.message.sender === 'me' && !contextMenu.message.is_deleted
              ? [
                {
                  label: 'Edit',
                  icon: Edit2,
                  act: () => {
                    setEditingMessage(contextMenu.message);
                    setEditText(contextMenu.message.text);
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
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* PDF Modal Viewer */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-xs font-bold text-slate-900">PDF Document Viewer</h3>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
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
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
              {contacts.map((contact) => (
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
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Slide-over Drawer */}
      <AnimatePresence>
        {showProfileDrawer && activeContact && (
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
                    {activeContact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-slate-900">{activeContact.name}</h4>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${activeContact.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{activeContact.online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contact Information</h5>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email</span>
                      <span className="text-slate-800 truncate max-w-[180px]">{activeContact.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone</span>
                      <span className="text-slate-800">9348532113</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Role</span>
                      <span className="text-slate-800 uppercase text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{ROLE_BY_TAB[activeTab] || 'User'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Seen</span>
                      <span className="text-slate-800">{activeContact.online ? 'Just now' : 'Yesterday, 6:30 PM'}</span>
                    </div>
                  </div>
                </div>

                {contactDirectoryInfo && (
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Academic Details</h5>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Linked Student</span>
                        <span className="text-slate-800">{contactDirectoryInfo.student_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Class & Section</span>
                        <span className="text-slate-800">{contactDirectoryInfo.class_name} - {contactDirectoryInfo.section_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Institute Name</span>
                        <span className="text-slate-800 truncate max-w-[180px]">{user?.instituteName || 'Eddva Institute'}</span>
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
                        const inp = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
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
        {showVideoMeetModal && activeContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase">Schedule Meeting</h3>
                <button
                  onClick={() => setShowVideoMeetModal(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs font-semibold">
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
                <div className="space-y-1">
                  <label className="text-slate-400">Meeting Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['online', 'offline'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setMeetMode(mode)}
                        className={`rounded-xl border px-3 py-2 text-xs font-black capitalize transition ${meetMode === mode
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-500'
                          }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
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
                {meetMode === 'online' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-slate-400">Meeting Platform</label>
                      <input
                        type="text"
                        value={meetPlatform}
                        onChange={(e) => setMeetPlatform(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Meeting Link</label>
                      <input
                        type="url"
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="text-slate-400">Meeting Location</label>
                    <input
                      type="text"
                      value={meetLocation}
                      onChange={(e) => setMeetLocation(e.target.value)}
                      placeholder="School campus / classroom / office"
                      className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await api.post('/meetings', {
                        title: meetTitle,
                        description: meetDesc,
                        meetingDate: meetDate,
                        startTime: meetTime,
                        durationMinutes: Number.parseInt(meetDuration, 10) || 30,
                        meetingMode: meetMode,
                        meetingPlatform: meetMode === 'online' ? meetPlatform : null,
                        meetingLink: meetMode === 'online' ? meetLink || null : null,
                        location: meetMode === 'offline' ? meetLocation : null,
                        recipientIds: [activeContact.id],
                      });
                      await loadMeetingInbox();
                      setShowVideoMeetModal(false);
                      showToast('Meeting request created successfully!', 'success');
                    } catch (err) {
                      showToast('Failed to create meeting request', 'error');
                    }
                  }}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  Save Meeting
                </button>
                <button
                  onClick={() => {
                    setShowVideoMeetModal(false);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* More Options Settings Modal */}
      <AnimatePresence>
        {showMoreOptions && activeContact && (
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

              <div className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setShowMoreOptions(false);
                      setShowProfileDrawer(true);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"
                  >
                    <User size={14} className="text-blue-500" /> View Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreOptions(false);
                      setShowSharedFilesModal(true);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"
                  >
                    <FileText size={14} className="text-indigo-500" /> Shared Files
                  </button>
                  <button
                    onClick={async () => {
                      if (!activeContact) return;
                      await api.patch(`/chat/messages/${activeContact.id}/read`).catch(() => { });
                      showToast('Conversation marked as read', 'success');
                      setShowMoreOptions(false);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"
                  >
                    <CheckCheck size={14} className="text-emerald-500" /> Mark as Read
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreOptions(false);
                      setShowDetails(true);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2.5 hover:bg-slate-50 transition"
                  >
                    <Info size={14} className="text-slate-500" /> Conversation Info
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shared Files Viewer Modal */}
      <AnimatePresence>
        {showSharedFilesModal && activeContact && (
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
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {sharedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-3 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-slate-800">{file.attachment_name}</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Shared at {file.time}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {file.attachment_name?.toLowerCase().endsWith('.pdf') && (
                        <button
                          onClick={() => {
                            setPdfPreviewUrl(file.attachment_url!);
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
        {showMediaGalleryModal && activeContact && (
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
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3">
                {sharedFiles
                  .filter(f => f.attachment_name?.toLowerCase().match(/\.(jpg|jpeg|png)$/))
                  .map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setMediaLightboxUrl(file.attachment_url!)}
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
              className="absolute bottom-16 left-4 z-50 w-56 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-2xl space-y-2 text-xs font-semibold text-slate-700"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-2">Communication</span>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    const el = document.querySelector('input[placeholder="Search messages..."]') as HTMLInputElement;
                    el?.focus();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <Search size={14} /> Search Messages
                </button>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    setShowMediaGalleryModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <Smile size={14} /> View Media Gallery
                </button>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    setShowSharedFilesModal(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <FileText size={14} /> View Shared Documents
                </button>
              </div>

              <div className="border-t border-slate-100 my-1 pt-1 space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider px-2">Conversation</span>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    if (activeContact) {
                      setPinnedChats((prev) => ({ ...prev, [activeContact.id]: !prev[activeContact.id] }));
                      showToast(pinnedChats[activeContact.id] ? 'Conversation unpinned' : 'Conversation pinned', 'success');
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <Plus size={14} /> {activeContact && pinnedChats[activeContact.id] ? 'Unpin Conversation' : 'Pin Conversation'}
                </button>
                <button
                  onClick={() => {
                    setShowQuickActions(false);
                    if (activeContact) {
                      setMutedChats((prev) => ({ ...prev, [activeContact.id]: !prev[activeContact.id] }));
                      showToast(mutedChats[activeContact.id] ? 'Notifications unmuted' : 'Notifications muted', 'success');
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  <Clock size={14} /> {activeContact && mutedChats[activeContact.id] ? 'Unmute' : 'Mute Notifications'}
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
            className={`pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
              }`}
          >
            {t.message}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChatSystem;
