import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Calendar,
  AlertTriangle,
  Send,
  X,
  CheckCircle2,
  Clock,
  Search,
  Paperclip,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Edit2,
  Reply as ReplyIcon,
  Forward,
  Copy,
  Info,
  Check,
  CheckCheck,
  FileText,
  ChevronDown,
  ChevronRight,
  User,
  Plus,
  Phone,
  Video,
  Smile,
} from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { useAuthStore } from "@/lib/auth-store";
import { createChatSocket } from "@/lib/chat-socket";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api/school-client";
import { getUploadUrl, uploadToS3 } from "@/lib/upload";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useConfirm } from "@/context/ConfirmContext";
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function ParentCommunication() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"messages" | "meetings" | "grievances">(() => {
    const tab = searchParams.get('tab');
    return tab === 'meetings' || tab === 'grievances' || tab === 'messages' ? tab : 'messages';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if ((tab === 'meetings' || tab === 'grievances' || tab === 'messages') && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab, searchParams]);

  return (
    <div className="space-y-6 md:space-y-8 h-[calc(100dvh-140px)] max-h-[calc(100dvh-140px)] min-h-0 flex flex-col">
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
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-[2rem] bg-white shadow-sm border border-slate-100 flex flex-col">
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "meetings" && <MeetingsTab />}
        {activeTab === "grievances" && <GrievancesTab />}
      </div>
    </div>
  );
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
  '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
  '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
  '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🫣', '🤭', '🫢', '🤫', '🫠', '✍️', '👍', '👎',
  '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌',
  '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖',
  '👋', '🤙', '🙌', '👏', '🙏', '🤝', '👂', '👃', '🧠', '👀',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🔥', '✨', '🎉', '⭐', '🌈', '☀️', '🌸', '💡', '💬', '🔔'
];

function MessagesTab() {
  const confirm = useConfirm();
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  // Track active chat peer ID
  useEffect(() => {
    (window as any).activeChatPeerId = activeContact?.id || null;
    return () => {
      (window as any).activeChatPeerId = null;
    };
  }, [activeContact]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [inChatSearch, setInChatSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Premium Interactive Workflows States
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showVideoMeetModal, setShowVideoMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('Discussion on Student Progress');
  const [meetDesc, setMeetDesc] = useState('Reviewing classroom schedule, assignments, and curriculum outline.');
  const [meetDuration, setMeetDuration] = useState('30 mins');
  const [meetDate, setMeetDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetTime, setMeetTime] = useState('14:00');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  const openTicketFromMessage = (ticketId: string) => {
    const normalized = String(ticketId || '').replace(/^#/, '').toUpperCase();
    if (normalized.startsWith('USR-')) {
      navigate(`/school/parent/communication?tab=grievances&ticketId=${encodeURIComponent(normalized)}&search=${encodeURIComponent(normalized)}`);
    }
  };

  const renderTicketLinkedText = (text: string) => {
    const parts = String(text || '').split(/((?:PLT|USR)-[A-Z0-9]{8})/gi);
    return parts.map((part, index) => {
      if (/^(?:PLT|USR)-[A-Z0-9]{8}$/i.test(part)) {
        const ticketId = part.toUpperCase();
        return (
          <button
            key={`${ticketId}-${index}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openTicketFromMessage(ticketId);
            }}
            className="font-black text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
          >
            {ticketId}
          </button>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  // 3-Column Layout: Details Panel toggle
  const [showDetails, setShowDetails] = useState(true);

  // Message Action States
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; message: any } | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [editText, setEditText] = useState("");
  const [forwardMessage, setForwardMessage] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  // Attachments View
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Typing indicators
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);

  const activePeerRef = useRef<string | null>(null);
  useEffect(() => {
    activePeerRef.current = activeContact?.id;
  }, [activeContact]);

  const loadContacts = async (showLoading = true) => {
    if (showLoading) setLoadingContacts(true);
    try {
      const data = await parentClient.getChatContacts();
      setContacts(data || []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    void loadContacts(true);
  }, []);

  useEffect(() => {
    const userIdParam = new URLSearchParams(window.location.search).get('userId');
    const targetId = userIdParam || location.state?.openContactId;
    if (targetId && contacts.length > 0) {
      const target = contacts.find((c) => String(c.id) === String(targetId));
      if (target) {
        openContact(target);
        // Clear history state to avoid re-triggering on future mounts
        window.history.replaceState({}, document.title);
      }
    }
  }, [contacts, location.state?.openContactId]);

  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (!ticketId || !activeContact) return;
    const prefix = `Ticket #${ticketId}: `;
    setMessageText((prev) => (prev.includes(ticketId) ? prev : `${prefix}${prev}`));
  }, [activeContact, searchParams]);

  const fetchMessages = async (peerId: string) => {
    setLoadingMessages(true);
    try {
      const res = await parentClient.getChatThread(peerId);
      setMessages(
        (res || []).map((m: any) => ({
          id: m.id,
          text: m.content ?? m.text,
          time: m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          sender: m.sender_id === user?.id ? 'me' : 'other',
          sender_id: m.sender_id,
          is_edited: m.is_edited,
          is_deleted: m.is_deleted,
          is_forwarded: m.is_forwarded,
          is_read: m.is_read,
          parent_message_id: m.parent_message_id,
          attachment_url: m.attachment_url,
          attachment_name: m.attachment_name,
          created_at: m.created_at
        }))
      );
    } catch (err) {
      console.error("Failed to fetch thread:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openContact = (contact: any) => {
    setActiveContact(contact);
    void fetchMessages(contact.id);
    setReplyingTo(null);
    setEditingMessage(null);
    setInChatSearch("");
    parentClient.markChatRead(contact.id).catch(() => { });
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

  // Stable refs for real-time handlers to avoid socket re-connections
  const loadContactsRef = useRef(loadContacts);
  useEffect(() => {
    loadContactsRef.current = loadContacts;
  }, [loadContacts]);

  const fetchMessagesRef = useRef(fetchMessages);
  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  // Fallback Polling every 30 seconds if socket is offline
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (!socketConnected) {
      interval = setInterval(() => {
        console.info('[ParentCommunication] Socket offline, running fallback polling...');
        void loadContactsRef.current(false);
        if (activePeerRef.current) {
          void fetchMessagesRef.current(activePeerRef.current);
        }
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [socketConnected]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = createChatSocket();
    socketRef.current = socket;

    const join = () => {
      const role = (user.role || '').toUpperCase();
      const targetId = role === 'SUPER_ADMIN'
        ? '00000000-0000-0000-0000-000000000001'
        : user.id;
      socket.emit('join_user', targetId);
    };
    socket.on('connect', () => {
      join();
      setSocketConnected(true);
      // Sync on reconnect/connect
      void loadContactsRef.current(false);
      if (activePeerRef.current) {
        void fetchMessagesRef.current(activePeerRef.current);
      }
    });
    socket.on('disconnect', () => setSocketConnected(false));
    join();

    socket.on('direct_message', (msg: any) => {
      const peerId = activePeerRef.current;
      if (peerId && (msg.sender_id === peerId || msg.receiver_id === peerId)) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(msg.id))) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              text: msg.content ?? msg.text,
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: msg.sender_id === user.id ? 'me' : 'other',
              sender_id: msg.sender_id,
              is_edited: msg.is_edited,
              is_deleted: msg.is_deleted,
              is_forwarded: msg.is_forwarded,
              is_read: msg.is_read,
              is_delivered: msg.is_delivered,
              parent_message_id: msg.parent_message_id,
              attachment_url: msg.attachment_url,
              attachment_name: msg.attachment_name,
              created_at: msg.created_at
            }
          ];
        });
        parentClient.markChatRead(peerId).catch(() => { });
      }
      void loadContactsRef.current(false);
    });

    socket.on('message_updated', (msg: any) => {
      const peerId = activePeerRef.current;
      if (peerId && (msg.sender_id === peerId || msg.receiver_id === peerId)) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, text: msg.text, is_edited: msg.is_edited, is_deleted: msg.is_deleted } : m))
        );
      }
      void loadContactsRef.current(false);
    });

    socket.on('conversation_read', (data: any) => {
      const peerId = activePeerRef.current;
      if (peerId && String(data.readerId) === String(peerId)) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === 'me' ? { ...m, is_read: true, is_delivered: true } : m))
        );
      }
      void loadContactsRef.current(false);
    });

    socket.on('messages_delivered', (data: any) => {
      const peerId = activePeerRef.current;
      if (peerId && String(data.receiverId) === String(peerId)) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === 'me' && !m.is_read ? { ...m, is_delivered: true } : m))
        );
      }
      void loadContactsRef.current(false);
    });

    socket.on('presence_change', (data: any) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === data.userId ? { ...c, online: data.status === 'online', lastSeen: data.lastSeen } : c))
      );
      if (activePeerRef.current === data.userId) {
        setActiveContact((prev: any) => prev ? { ...prev, online: data.status === 'online', lastSeen: data.lastSeen } : null);
      }
    });

    socket.on('typing', (data: any) => {
      const peerId = activePeerRef.current;
      if (peerId && data.senderId === peerId) {
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
  }, [user?.id]);

  function handleInputKeyPress() {
    if (socketRef.current && activeContact) {
      socketRef.current.emit('typing', {
        roomId: activeContact.id,
        isTyping: true,
        receiverId: activeContact.id,
      });
    }
  }

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
              sender_id: user?.id,
              attachment_url: created.attachment_url,
              attachment_name: created.attachment_name,
              created_at: created.created_at
            }
          ];
        });
      }
      void loadContacts(false);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  }

  const sendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || !activeContact) return;
    setMessageText("");
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
              sender_id: user?.id,
              parent_message_id: created.parent_message_id,
              created_at: created.created_at
            }
          ];
        });
      }
      setReplyingTo(null);
      void loadContacts(false);
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
      setMessageText(trimmed);
    }
  };

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
      cancelLabel: "Cancel",
      variant: "destructive"
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

  function handleForwardMessage(contact: any) {
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
      void loadContacts(false);
    }).catch(() => {
      alert("Failed to forward message");
    });
  }

  function handleContextMenu(e: React.MouseEvent, msg: any) {
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

  const sharedFiles = useMemo(() => {
    return messages.filter((m) => m.attachment_url);
  }, [messages]);

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
    const groups: Array<{ type: 'separator'; label: string } | { type: 'message'; data: any }> = [];
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

  const roleLabel = (role?: string) =>
    role && role.toUpperCase().includes('ADMIN') ? 'Administration' : 'Teacher';

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [contacts, search]);

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
    <div className="h-[calc(100dvh-160px)] max-h-[calc(100dvh-160px)] min-h-0 rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden flex flex-col md:flex-row relative">
      {/* Column 1: Contact List */}
      <div className={`w-full md:w-[300px] lg:w-[320px] shrink-0 border-r border-slate-100 bg-slate-50/10 flex flex-col min-h-0 transition-all ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-white">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Teachers & Admin</label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingContacts ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-16 w-full rounded-xl animate-pulse" />
              <Skeleton className="h-16 w-full rounded-xl animate-pulse" />
            </div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((c: any) => {
              const active = activeContact?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => openContact(c)}
                  className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${active ? "bg-blue-50/80 border border-blue-100/50 shadow-xs" : "hover:bg-slate-50/60 border border-transparent"
                    }`}
                >
                  <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-xs">
                    {(c.name || '?').charAt(0).toUpperCase()}
                    {c.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate">{c.name}</span>
                      <span className="text-[9px] font-semibold text-slate-400 shrink-0">{c.time}</span>
                    </div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mt-0.5">{roleLabel(c.role)}</p>
                    <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">{c.lastMessage || 'No messages yet'}</p>
                  </div>
                  {c.unread > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-black text-white shrink-0">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
              <Users className="h-8 w-8 text-slate-350 mb-2" />
              <p className="text-xs font-bold text-slate-500">No staff found</p>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Chat Area */}
      <div className={`flex-1 flex flex-col bg-white min-w-0 min-h-0 ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0 shadow-xs z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 text-slate-500" onClick={() => setActiveContact(null)}>
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-black text-white shadow-sm">
                  {(activeContact.name || '?').charAt(0).toUpperCase()}
                  {activeContact.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />}
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
                  <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">{roleLabel(activeContact.role)}</p>
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

            {/* Message Thread */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-slate-50/20">
              {loadingMessages ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-2/3 rounded-2xl bg-white" />
                  <Skeleton className="h-12 w-2/3 ml-auto rounded-2xl bg-blue-50" />
                </div>
              ) : groupedMessages.length > 0 ? (
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
                            <Forward className="h-3 w-3" /> Forwarded
                          </p>
                        )}

                        {msg.parent_message_id && (
                          <div className={`mb-2 border-l-2 pl-2 text-[10px] opacity-80 ${mine ? 'border-blue-300 text-blue-600' : 'border-slate-300 text-slate-500'}`}>
                            Reply to message
                          </div>
                        )}

                        {/* Attachments */}
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

                        {msg.text?.startsWith('[MEETING_CARD]') ? (
                          renderMeetingCard(msg.text)
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{renderTicketLinkedText(msg.text)}</p>
                        )}

                        <div className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-85">
                          <span className={mine ? 'text-blue-500' : 'text-slate-400'}>{msg.time}</span>
                          {msg.is_edited && <span className={mine ? 'text-blue-500' : 'text-slate-400'}>• Edited</span>}
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
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center opacity-50">
                  <MessageCircle className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-500">No messages yet. Send a message to start.</p>
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

            {/* Reply banner */}
            {replyingTo && (
              <div className="flex items-center justify-between border-t border-blue-50 bg-slate-50 px-4 py-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <ReplyIcon className="h-3.5 w-3.5" />
                  <span>Replying to: <strong>{replyingTo.text}</strong></span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input Form */}
            <div className="relative border-t border-slate-100 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pt-4 bg-white shrink-0 z-10">
              {showEmojiPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                  <div className="absolute bottom-16 left-4 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Emoji</span>
                      <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-slate-650 text-xs">✕</button>
                    </div>
                    <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                      {EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMessageText(prev => prev + emoji)}
                          className="text-lg hover:scale-125 transition duration-100 p-0.5 active:bg-slate-100 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {editingMessage ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 rounded-2xl border border-blue-100 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-400"
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
                  <div className="flex-1 flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-4 py-1.5 transition-all focus-within:border-blue-300 focus-within:bg-white">
                    <button className="text-slate-400 hover:text-slate-600 pr-2" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
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
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!messageText.trim() || uploading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 hover:brightness-110 disabled:opacity-40 transition"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center opacity-50 bg-slate-50/50">
            <MessageCircle className="h-12 w-12 text-slate-400 mb-3" />
            <p className="text-sm font-bold text-slate-600">Select a teacher or admin to view messages</p>
          </div>
        )}
      </div>

      {/* Right Column: Contact Details & Shared Files */}
      {showDetails && activeContact && (
        <div className="hidden xl:flex w-[280px] shrink-0 flex-col border-l border-slate-100 bg-slate-50/10">
          <div className="p-6 text-center border-b border-slate-100 bg-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-bold text-white shadow-sm">
              {(activeContact.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <h4 className="mt-3 text-xs font-bold text-slate-900">{activeContact.name}</h4>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{roleLabel(activeContact.role)}</p>
            <p className="text-xs font-semibold text-slate-500 truncate mt-1">{activeContact.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 px-4 py-4 border-b border-slate-100 bg-white shrink-0 lg:grid-cols-4">
            {[
              { label: 'Profile', icon: <User size={14} />, act: () => setShowProfileDrawer(true) },
              { label: 'Shared Files', icon: <FileText size={14} />, act: () => setShowSharedFilesModal(true) },
              { label: 'Info', icon: <Info size={14} />, act: () => setShowDetails(true) },
              { label: 'More', icon: <MoreVertical size={14} />, act: () => setShowMoreOptions(true) },
            ].map((btn, idx) => (
              <button key={idx} onClick={btn.act} className="flex flex-col items-center gap-1 hover:opacity-85 transition">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 shadow-xs">
                  {btn.icon}
                </div>
                <span className="text-[9px] font-bold text-slate-400">{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-b border-slate-100 bg-white shrink-0">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Search in Chat</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={inChatSearch}
                onChange={(e) => setInChatSearch(e.target.value)}
                placeholder="Search messages..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs font-semibold outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>
            {inChatSearch.trim() && (
              <div className="mt-2 max-h-[140px] overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100/60 no-scrollbar text-slate-700">
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
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
                      className="rounded p-1 text-slate-400 hover:bg-slate-50 transition shrink-0"
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
                navigator.clipboard.writeText(contextMenu.message.content || contextMenu.message.text);
              }
            },
            ...(contextMenu.message.sender_id === user?.id && !contextMenu.message.is_deleted
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

      {/* PDF Modal Viewer */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white">
              <h3 className="text-xs font-bold text-slate-900">PDF Document Viewer</h3>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe src={pdfPreviewUrl} className="h-full w-full border-none" title="pdf-viewer" />
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900">Forward Message</h3>
              <button
                onClick={() => setForwardMessage(null)}
                className="rounded-full p-1.5 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
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
                    <p className="text-[10px] text-slate-400 uppercase font-black">{roleLabel(contact.role)}</p>
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

              <div className="space-y-4 text-xs font-semibold text-slate-700">
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
          </>
        )}
      </AnimatePresence>

      {/* Video Meet Modal */}
      <AnimatePresence>
        {showVideoMeetModal && activeContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
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
                  className="rounded-full p-1.5 hover:bg-slate-100 transition"
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
                  <CustomSelect
          onChange={setMeetDuration}
                    value={meetDuration}
                    options={[
                    { value: "15 mins", label: "15 mins" },
                    { value: "30 mins", label: "30 mins" },
                    { value: "60 mins", label: "60 mins" },
                    { value: "90 mins", label: "90 mins" },
                  ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={async () => {
                    const roomUrl = `https://meet.eddva.com/room/${Math.random().toString(36).substring(2, 11)}`;
                    const formattedInvite = `[MEETING_CARD]|${meetTitle}|${meetDate} ${meetTime}|${meetDuration}|${meetDesc}|${roomUrl}`;

                    try {
                      const res = await api.post('/chat/messages', {
                        receiverId: activeContact.id,
                        content: formattedInvite
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
                              sender_id: user?.id,
                              created_at: created.created_at
                            }
                          ];
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
                          setMutedChats((prev) => ({ ...prev, [activeContact.id]: !prev[activeContact.id] }));
                          showToast(mutedChats[activeContact.id] ? 'Notifications unmuted' : 'Notifications muted', 'success');
                        }}
                        className={`rounded-full px-3 py-1 font-bold text-[10px] transition ${mutedChats[activeContact.id] ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {mutedChats[activeContact.id] ? 'Muted' : 'Mute'}
                      </button>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-t border-slate-100/60">
                      <span className="text-slate-600">Archive Conversation</span>
                      <button
                        onClick={() => {
                          setArchivedChats((prev) => ({ ...prev, [activeContact.id]: !prev[activeContact.id] }));
                          showToast(archivedChats[activeContact.id] ? 'Conversation unarchived' : 'Conversation archived', 'success');
                        }}
                        className={`rounded-full px-3 py-1 font-bold text-[10px] transition ${archivedChats[activeContact.id] ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {archivedChats[activeContact.id] ? 'Archived' : 'Archive'}
                      </button>
                    </div>
                  </div>
                </div>

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
                      await parentClient.markChatRead(activeContact.id).catch(() => { });
                      setShowMoreOptions(false);
                      showToast('Conversation marked as read', 'success');
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

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-slate-700">
                {sharedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/30 p-3 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-slate-800">{file.attachment_name}</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Shared recently</p>
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
}

function MeetingsTab() {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    teacherId: '',
    reason: '',
    meetingType: 'online',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '14:00',
    duration: '30',
    meetingPlatform: 'Google Meet',
    meetingLink: '',
    location: '',
  });
  const queryClient = useQueryClient();

  const { data: meetings, isLoading, isError } = useQuery({
    queryKey: ['parent-meetings'],
    queryFn: () => parentClient.getMeetingRequests(),
  });

  const meetingList = Array.isArray(meetings) ? meetings : [];

  const { data: teachers } = useQuery({
    queryKey: ['parent-teachers'],
    queryFn: () => parentClient.getTeachers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => parentClient.createMeetingRequest(data),
    onSuccess: (createdMeeting: any) => {
      if (createdMeeting?.id) {
        queryClient.setQueryData(['parent-meetings'], (current: any) => {
          const currentList = Array.isArray(current) ? current : [];
          const nextList = currentList.filter((item: any) => item?.id !== createdMeeting.id);
          return [createdMeeting, ...nextList];
        });
      }
      setShowForm(false);
      queryClient.refetchQueries({ queryKey: ['parent-meetings'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/meetings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-meetings'] });
    },
  });

  const prettyStatus = (status: string) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';

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
      ) : isError ? (
        <div className="flex flex-col items-center justify-center text-center py-12 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
          <Calendar className="mb-3 h-12 w-12" />
          <p className="text-sm font-bold">Unable to load meeting requests right now</p>
        </div>
      ) : meetingList.length > 0 ? (
        <div className="space-y-4">
          {meetingList.map((m: any) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[15px] font-black text-slate-900">{m.title || 'Meeting'}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${m.isIncoming ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {m.isIncoming ? 'Incoming' : 'Requested'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {m.counterpartName || m.teacherName}
                    {m.counterpartRole ? ` • ${String(m.counterpartRole).replace('_', ' ')}` : ''}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    {m.date || 'Date TBD'} • {m.timeSlot || 'Time TBD'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{m.meetingMode || 'online'}</span>
                    {m.meetingPlatform && <span className="rounded-full bg-slate-100 px-2 py-1">{m.meetingPlatform}</span>}
                    {m.location && <span className="rounded-full bg-slate-100 px-2 py-1">{m.location}</span>}
                  </div>
                  {m.reason && <p className="text-xs font-medium italic text-slate-400 mt-2">"{m.reason}"</p>}
                  {m.meetingLink && !['Completed', 'Cancelled', 'Rejected'].includes(prettyStatus(m.status)) && (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-black text-blue-600 hover:text-blue-700"
                    >
                      Join meeting
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:text-right">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${['Accepted', 'Scheduled', 'Completed'].includes(prettyStatus(m.status)) ? 'bg-emerald-100 text-emerald-700' :
                  prettyStatus(m.status) === 'Pending' ? 'bg-amber-100 text-amber-700' :
                    ['Rejected', 'Cancelled'].includes(prettyStatus(m.status)) ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-600'
                  }`}>
                  {['Accepted', 'Scheduled', 'Completed'].includes(prettyStatus(m.status)) && <CheckCircle2 className="h-3 w-3" />}
                  {prettyStatus(m.status) === 'Pending' && <Clock className="h-3 w-3" />}
                  {['Rejected', 'Cancelled'].includes(prettyStatus(m.status)) && <X className="h-3 w-3" />}
                  {prettyStatus(m.status)}
                </span>
                {prettyStatus(m.status) === 'Pending' && (
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    {m.isIncoming ? (
                      <>
                        <button
                          onClick={() => statusMutation.mutate({ id: m.id, status: 'accepted' })}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-emerald-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ id: m.id, status: 'rejected' })}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-[11px] font-black text-red-600 hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => statusMutation.mutate({ id: m.id, status: 'cancelled' })}
                        className="block w-full text-xs font-black text-red-500 hover:text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
                {['Accepted', 'Scheduled'].includes(prettyStatus(m.status)) && (
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => statusMutation.mutate({ id: m.id, status: 'completed' })}
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-[11px] font-black text-blue-700 hover:bg-blue-200"
                    >
                      Complete
                    </button>
                  </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Request Meeting</h2>
                <p className="text-sm font-semibold text-slate-500">Step {step} of 2 &bull; Create a focused meeting request.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setStep(1);
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {step === 1 && (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Teacher</label>
                    <CustomSelect
          onChange={(val) => setForm(prev => ({ ...prev, teacherId: val }))}
                      value={form.teacherId}
                      options={[
                      { value: "", label: "Select teacher" },
                      ...(teachers || []).map((t: any) => ({ value: t.id, label: `${t.name} (${t.subject})` })),
                    ]}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Reason</label>
                    <textarea
                      rows={3}
                      value={form.reason}
                      onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:bg-white"
                      placeholder="What would you like to discuss?"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['online', 'offline'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, meetingType: mode }))}
                          className={`rounded-2xl border px-4 py-3 text-sm font-black capitalize transition ${
                            form.meetingType === mode
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Preferred Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Time Slot</label>
                    <input
                      type="time"
                      value={form.timeSlot}
                      onChange={(e) => setForm((prev) => ({ ...prev, timeSlot: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Duration</label>
                    <CustomSelect
          onChange={(val) => setForm(prev => ({ ...prev, duration: val }))}
                      value={form.duration}
                      options={[
                      { value: "15", label: "15 mins" },
                      { value: "30", label: "30 mins" },
                      { value: "45", label: "45 mins" },
                      { value: "60", label: "60 mins" },
                    ]}
                      className="w-full"
                    />
                  </div>

                  {form.meetingType === 'online' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Platform</label>
                        <input
                          value={form.meetingPlatform}
                          onChange={(e) => setForm((prev) => ({ ...prev, meetingPlatform: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Meeting Link</label>
                        <input
                          value={form.meetingLink}
                          onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                          placeholder="https://meet.google.com/..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Location</label>
                      <input
                        value={form.location}
                        onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Principal office / campus / classroom"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (step === 2) setStep(1);
                  else {
                    setShowForm(false);
                    setStep(1);
                  }
                }}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                {step === 2 ? 'Back' : 'Cancel'}
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  disabled={!form.teacherId || !form.reason}
                  onClick={() => setStep(2)}
                  className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={createMutation.isPending || !form.date || !form.timeSlot}
                  onClick={() => {
                    createMutation.mutate({
                      teacherId: form.teacherId,
                      reason: form.reason,
                      meetingType: form.meetingType,
                      meetingMode: form.meetingType,
                      date: form.date,
                      timeSlot: form.timeSlot,
                      duration: Number(form.duration),
                      durationMinutes: Number(form.duration),
                      meetingPlatform: form.meetingPlatform,
                      meetingLink: form.meetingLink,
                      location: form.location,
                    });
                  }}
                  className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Scheduling...' : 'Create Meeting'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GrievancesTab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<any | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: grievances, isLoading } = useQuery({
    queryKey: ['parent-grievances', searchQuery],
    queryFn: () => parentClient.getGrievances(searchQuery),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => parentClient.submitGrievance(data),
    onSuccess: (res) => {
      alert(`Grievance submitted successfully. Ticket #${res.ticketNumber || 'GRV'}`);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['parent-grievances'] });
    }
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => parentClient.reopenGrievance(id),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ['parent-grievances'] });
      if (updated?.id) {
        setSelectedGrievance((prev: any) => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
      }
    }
  });

  const { data: selectedMessages = [], isLoading: loadingSelectedMessages } = useQuery({
    queryKey: ['parent-grievance-messages', selectedGrievance?.id],
    queryFn: () => parentClient.getGrievanceMessages(selectedGrievance.id),
    enabled: Boolean(selectedGrievance?.id),
  });

  useEffect(() => {
    const ticketSearch = searchParams.get('search') || searchParams.get('ticketId');
    if (ticketSearch && searchQuery !== ticketSearch.replace(/^#/, '')) {
      setSearchInput(ticketSearch.replace(/^#/, ''));
      setSearchQuery(ticketSearch.replace(/^#/, ''));
    }
  }, [searchParams, searchQuery]);

  useEffect(() => {
    const ticketId = searchParams.get('ticketId')?.replace(/^#/, '').toUpperCase();
    if (!ticketId || !Array.isArray(grievances) || selectedGrievance) return;
    const found = grievances.find((g: any) => String(g.ticketNumber || '').toUpperCase() === ticketId);
    if (found) setSelectedGrievance(found);
  }, [grievances, searchParams, selectedGrievance]);

  const closeTicketModal = () => {
    setSelectedGrievance(null);
  };

  const openInstituteChat = async (ticket: any) => {
    try {
      const contacts = await parentClient.getChatContacts();
      const admin = (contacts || []).find((contact: any) => String(contact.role || '').toUpperCase() === 'INSTITUTE_ADMIN');
      if (!admin?.id) {
        alert('No institute admin is available for chat.');
        return;
      }
      navigate(`/school/parent/communication?tab=messages&userId=${encodeURIComponent(admin.id)}&ticketId=${encodeURIComponent(ticket.ticketNumber)}&ticketType=grievance`);
    } catch (err) {
      console.error(err);
      alert('Unable to open institute admin chat.');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-black text-slate-900">My Grievances</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search ticket ID or subject..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setSearchQuery(searchInput.trim());
            }}
            onBlur={() => {
              if (searchInput.trim() !== searchQuery) setSearchQuery(searchInput.trim());
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700"
          >
            Submit Grievance
          </button>
        </div>
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
                <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${g.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                  g.status === 'Reopened' ? 'bg-indigo-100 text-indigo-700' :
                  g.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                    g.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-500'
                  }`}>
                  {g.status}
                </span>
              </div>
              <h4 className="text-[15px] font-black text-slate-900">{g.subject}</h4>
              <p className="text-xs font-semibold text-slate-400 mt-1">Submitted on {g.date}</p>

              <label className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <span>Reopen Ticket</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={String(g.rawStatus || g.status || '').toUpperCase() === 'REOPENED' || g.status === 'Reopened'}
                  disabled={reopenMutation.isPending || ['OPEN', 'REOPENED'].includes(String(g.rawStatus || g.status || '').toUpperCase()) || g.status === 'Open' || g.status === 'Reopened' || !g.id}
                  onChange={(event) => {
                    if (event.target.checked && g.id) reopenMutation.mutate(g.id);
                  }}
                  className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-slate-300 transition before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-blue-600 checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedGrievance(g)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  View Replies
                </button>
                <button
                  type="button"
                  onClick={() => void openInstituteChat(g)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-blue-700 transition hover:bg-blue-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open Chat
                </button>
              </div>

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

      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeTicketModal} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Ticket</span>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-blue-600">#{selectedGrievance.ticketNumber}</p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-950">{selectedGrievance.subject}</h2>
              </div>
              <button
                type="button"
                onClick={closeTicketModal}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-700">
                  {selectedGrievance.description || 'No description provided.'}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</h4>
                  <div className="mt-2">
                    <span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${selectedGrievance.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                      selectedGrievance.status === 'Reopened' ? 'bg-indigo-100 text-indigo-700' :
                      selectedGrievance.status === 'In Review' ? 'bg-amber-100 text-amber-700' :
                        selectedGrievance.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-500'
                      }`}>
                      {selectedGrievance.status || 'Open'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Created At</h4>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {selectedGrievance.date || 'Unknown Date'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</h4>
                  <p className="mt-2 text-sm font-bold text-slate-800">{selectedGrievance.type || 'General'}</p>
                </div>

                <div className="col-span-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                    Institute Admin Replies
                  </h4>
                  {loadingSelectedMessages ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-10 w-4/5 rounded-lg" />
                    </div>
                  ) : selectedMessages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs font-semibold text-slate-500">
                      No institute admin replies have been sent for this ticket yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMessages.map((message: any) => (
                        <div key={message.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-slate-700">
                            {message.content || 'Message unavailable'}
                          </p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {message.senderName || 'Institute Admin'} - {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-6">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                <span>Reopen</span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={String(selectedGrievance.rawStatus || selectedGrievance.status || '').toUpperCase() === 'REOPENED' || selectedGrievance.status === 'Reopened'}
                  disabled={reopenMutation.isPending || ['OPEN', 'REOPENED'].includes(String(selectedGrievance.rawStatus || selectedGrievance.status || '').toUpperCase()) || selectedGrievance.status === 'Open' || selectedGrievance.status === 'Reopened' || !selectedGrievance.id}
                  onChange={(event) => {
                    if (event.target.checked && selectedGrievance.id) reopenMutation.mutate(selectedGrievance.id);
                  }}
                  className="h-5 w-10 cursor-pointer appearance-none rounded-full bg-slate-300 transition before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition checked:bg-blue-600 checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openInstituteChat(selectedGrievance)}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open Chat
                </button>
                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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
                <CustomSelect
                name="type"
                value="GENERAL" 
                onChange={(e) => {}} // form handles it via name
                options={[
                  { value: "GENERAL", label: "General" },
                  { value: "ABSENCE", label: "Absence Note" },
                  { value: "BEHAVIOR", label: "Behavior" },
                  { value: "ACADEMIC", label: "Academic" }
                ]}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500"
              />
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

function ParentGrievanceMessages({ grievanceId }: { grievanceId: string }) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['parent-grievance-messages', grievanceId],
    queryFn: () => parentClient.getGrievanceMessages(grievanceId),
    enabled: Boolean(grievanceId),
  });

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Institute Replies</p>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-8 w-4/5 rounded-lg" />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-xs font-semibold text-slate-500">No institute replies yet.</p>
      ) : (
        <div className="space-y-2">
          {messages.map((message: any) => (
            <div key={message.id} className="rounded-lg border border-slate-100 bg-white p-3">
              <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-slate-700">
                {message.content || 'Message unavailable'}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {message.senderName || 'Institute Admin'} - {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Recently'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
