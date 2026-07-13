import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import schoolApi from '@/lib/api/school-client';
import { apiClient } from '@/lib/api/client';
import { createChatSocket } from '@/lib/chat-socket';
import { useAuth } from '@/context/SchoolAuthContext';
import { getUploadUrl, uploadToS3 } from '@/lib/upload';
import { useConfirm } from '@/context/ConfirmContext';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { cn } from "@/lib/utils";

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

export default function Communications({ heightClass = 'h-[calc(100dvh-112px)]' }) {
  const confirm = useConfirm();
  const { user, institute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
  const isCoachingAdminRoute = location.pathname.startsWith('/admin');
  const api = (isSuperAdminRoute || isCoachingAdminRoute) ? apiClient : schoolApi;

  const userRole = user?.role ? String(user.role).toUpperCase() : '';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const isMe = (id) => id === user?.id || (isSuperAdmin && id === '00000000-0000-0000-0000-000000000001');

  const PANELS = isSuperAdmin
    ? [{ key: 'INSTITUTE_ADMIN', label: 'Institute Admins' }]
    : [
      { key: 'TEACHER', label: 'Admin <-> Teacher' },
      { key: 'PARENT', label: 'Admin <-> Parent' },
      { key: 'SUPER_ADMIN', label: 'Super Admin Support' },
    ];

  const [activePanel, setActivePanel] = useState(() => {
    if (userRole === 'SUPER_ADMIN') return 'INSTITUTE_ADMIN';
    if (userRole === 'INSTITUTE_ADMIN') return 'SUPER_ADMIN';
    return 'TEACHER';
  });
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
    const params = new URLSearchParams(window.location.search);
    const requestedPanel = params.get('panel') || params.get('role');
    const validPanelKeys = isSuperAdmin
      ? ['INSTITUTE_ADMIN']
      : ['TEACHER', 'PARENT', 'SUPER_ADMIN'];

    if (requestedPanel && validPanelKeys.includes(requestedPanel) && requestedPanel !== activePanel) {
      setActivePanel(requestedPanel);
      return;
    }

    const ticketIdParam = params.get('ticketId');
    const userIdParam = params.get('userId') || (ticketIdParam ? users[0]?.id : null);
    if (!userIdParam || users.length === 0) return;

    const peer = users.find((u) => String(u.id) === String(userIdParam));
    if (peer) {
      if (!selectedUser || String(selectedUser.id) !== String(userIdParam)) {
        openConversation(peer);
      }
    } else {
      // If not in current panel, search the remaining panels so deep links can open the right chat.
      const checkOtherPanel = async () => {
        const panelsToCheck = validPanelKeys.filter((panel) => panel !== activePanel);
        try {
          for (const nextPanel of panelsToCheck) {
            const res = await api.get('/chat/users', { params: { role: nextPanel } });
            const otherUsers = res.data?.data ?? [];
            const found = otherUsers.find((u) => String(u.id) === String(userIdParam));
            if (found) {
              setActivePanel(nextPanel);
              setUsers(otherUsers);
              openConversation(found);
              break;
            }
          }
        } catch (e) {
          console.error("Error looking up user in other chat panels:", e);
        }
      };
      void checkOtherPanel();
    }
  }, [users, activePanel, isSuperAdmin, selectedUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('ticketId');
    if (!ticketId || !selectedUser) return;
    const prefix = `Ticket #${ticketId}: `;
    setMessageText((prev) => (prev.includes(ticketId) ? prev : `${prefix}${prev}`));
  }, [selectedUser]);

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [inChatSearch, setInChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
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
  const [meetMode, setMeetMode] = useState('online');
  const [meetPlatform, setMeetPlatform] = useState('Google Meet');
  const [meetLink, setMeetLink] = useState('');
  const [meetLocation, setMeetLocation] = useState('');
  const [showBulkMeetModal, setShowBulkMeetModal] = useState(false);
  const [meetingOptions, setMeetingOptions] = useState({ teachers: [], classes: [], sections: [] });
  const [loadingMeetingOptions, setLoadingMeetingOptions] = useState(false);
  const [bulkTargetType, setBulkTargetType] = useState('section_parents');
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkSectionId, setBulkSectionId] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
      .map((m) => `[${new Date(m.created_at || Date.now()).toLocaleTimeString()}] ${isMe(m.sender_id) ? 'Me' : selectedUser.name}: ${m.content || m.text}`)
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

  const openTicketFromMessage = (ticketId) => {
    const normalized = String(ticketId || '').replace(/^#/, '').toUpperCase();
    const tab = normalized.startsWith('USR-') ? 'user-support' : 'platform-support';
    const basePath = isSuperAdminRoute ? '/super-admin/complaints' : '/school/admin/complaints';
    navigate(`${basePath}?tab=${tab}&ticketId=${encodeURIComponent(normalized)}&search=${encodeURIComponent(normalized)}`);
  };

  const renderTicketLinkedText = (text) => {
    const value = String(text || '');
    const parts = value.split(/((?:PLT|USR)-[A-Z0-9]{8})/gi);
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

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selectedUserRef = useRef(null);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const activePanelRef = useRef(activePanel);
  useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  const fetchConversationsRef = useRef(fetchConversations);
  useEffect(() => {
    fetchConversationsRef.current = fetchConversations;
  }, [fetchConversations]);

  const reloadActiveThread = async () => {
    const peer = selectedUserRef.current;
    if (peer) {
      try {
        const res = await api.get(`/chat/messages/${peer.id}`);
        const list = res.data?.data ?? [];
        setMessages(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to reload active thread', err);
      }
    }
  };

  const reloadActiveThreadRef = useRef(reloadActiveThread);
  useEffect(() => {
    reloadActiveThreadRef.current = reloadActiveThread;
  }, [reloadActiveThread]);

  // Fallback Polling every 30 seconds if socket is offline
  useEffect(() => {
    let interval = null;
    if (!socketConnected) {
      interval = setInterval(() => {
        console.info('[Communications] Socket offline, running fallback polling...');
        void fetchConversationsRef.current(activePanelRef.current);
        void reloadActiveThreadRef.current();
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [socketConnected]);

  // Heartbeat / Socket Presence Integration
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
      void fetchConversationsRef.current(activePanelRef.current);
      void reloadActiveThreadRef.current();
    });
    socket.on('disconnect', () => setSocketConnected(false));
    join();

    socket.on('direct_message', (msg) => {
      const peer = selectedUserRef.current;
      if (
        peer &&
        (msg.sender_id === peer.id || msg.receiver_id === peer.id)
      ) {
        setMessages((prev) => {
          if (prev.some(m => String(m.id) === String(msg.id))) return prev;
          return [...prev, msg];
        });
        api.patch(`/chat/messages/${peer.id}/read`).catch(() => { });
      }
      void fetchConversationsRef.current(activePanelRef.current);
    });

    socket.on('message_updated', (msg) => {
      const peer = selectedUserRef.current;
      if (
        peer &&
        (msg.sender_id === peer.id || msg.receiver_id === peer.id)
      ) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, ...msg, content: msg.text } : m))
        );
      }
      void fetchConversationsRef.current(activePanelRef.current);
    });

    socket.on('conversation_read', (data) => {
      const peer = selectedUserRef.current;
      if (peer && String(data.readerId) === String(peer.id)) {
        setMessages((prev) =>
          prev.map((m) => (isMe(m.sender_id) ? { ...m, is_read: true, is_delivered: true } : m))
        );
      }
      void fetchConversationsRef.current(activePanelRef.current);
    });

    socket.on('messages_delivered', (data) => {
      const peer = selectedUserRef.current;
      if (peer && String(data.receiverId) === String(peer.id)) {
        setMessages((prev) =>
          prev.map((m) => (isMe(m.sender_id) && !m.is_read ? { ...m, is_delivered: true } : m))
        );
      }
      void fetchConversationsRef.current(activePanelRef.current);
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
      const peer = selectedUserRef.current;
      if (peer && data.senderId === peer.id) {
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

  useEffect(() => {
    setUsers([]);
    setConversations([]);
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

  useEffect(() => {
    if (!showBulkMeetModal) return;
    let alive = true;
    setLoadingMeetingOptions(true);
    api.get('/meetings/options')
      .then((res) => {
        if (!alive) return;
        setMeetingOptions(res.data?.data ?? { teachers: [], classes: [], sections: [] });
      })
      .catch((err) => {
        console.error('Failed to load meeting options', err);
      })
      .finally(() => {
        if (alive) setLoadingMeetingOptions(false);
      });
    return () => {
      alive = false;
    };
  }, [showBulkMeetModal]);

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
    setShowChatSearch(false);
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
    const onlineAdmins = users.filter((u) => u.role === 'INSTITUTE_ADMIN' && u.online).length;
    return { active, unread, onlineTeachers, onlineParents, onlineAdmins };
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
    <div className={`flex ${heightClass} min-h-0 w-full flex-col overflow-hidden px-2 sm:px-4 lg:px-6`}>
      {!isSuperAdmin && (
        <div className={cn("shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3", selectedUser && "hidden md:grid")}>
          {[
            { label: 'Active Chats', val: stats.active, sub: 'This month' },
            { label: 'Unread Badges', val: stats.unread, sub: 'Needs reply', alert: stats.unread > 0 },
            { label: 'Online Teachers', val: stats.onlineTeachers, sub: 'Live on system' },
            { label: 'Online Parents', val: stats.onlineParents, sub: 'Connected now' },
          ].map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className={`text-xl font-black ${item.alert ? 'text-red-500' : 'text-slate-800'}`}>{item.val}</span>
                <span className="text-[9px] font-bold leading-none text-slate-400">{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={cn(
        isSuperAdmin ? '' : 'mt-3',
        "flex w-fit max-w-full shrink-0 gap-1.5 rounded-2xl border border-slate-100/60 bg-slate-50/50 p-1",
        selectedUser && "hidden md:flex"
      )}>
        {PANELS.map((panel) => (
          <button
            key={panel.key}
            onClick={() => setActivePanel(panel.key)}
            className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activePanel === panel.key
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
          >
            {panel.label}
          </button>
        ))}
      </div>

      {/* 3-Column Redesigned Layout */}
      <div className="mt-3 flex-1 min-h-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl flex flex-col md:flex-row relative">

        {/* Column 1: Contacts Sidebar */}
        <div className={`w-full md:w-[320px] lg:w-[350px] border-r border-slate-100 flex flex-col shrink-0 min-h-0 bg-slate-50/10 transition-all ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 bg-white border-b border-slate-100/60 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activePanel === 'TEACHER' ? 'teachers' :
                    activePanel === 'PARENT' ? 'parents' :
                      activePanel === 'INSTITUTE_ADMIN' ? 'institute admins' :
                        'super admin'
                  }...`}
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
                <p className="text-xs font-bold text-slate-500">
                  {activePanel === 'SUPER_ADMIN' ? 'No super admin found.' :
                    activePanel === 'INSTITUTE_ADMIN' ? 'No institute admins found.' :
                      'No users found.'}
                </p>
                {activePanel === 'SUPER_ADMIN' && (
                  <p className="text-[10px] text-slate-400 mt-1">The platform super admin will appear here once registered.</p>
                )}
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
                      className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${active
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
                            {item.last_message || (activePanel === 'INSTITUTE_ADMIN' && item.institute_name ? item.institute_name : 'No messages yet')}
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
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-white ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {!selectedUser ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 opacity-60 bg-slate-50/10">
              <MessageSquare className="h-10 w-10 text-slate-350 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Select a conversation</h3>
              <p className="text-xs text-slate-400">Choose a contact to start messaging</p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0 shadow-xs z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <button className="md:hidden p-1.5 -ml-1 rounded-xl hover:bg-slate-100 text-slate-500" onClick={() => setSelectedUser(null)}>
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
                      {selectedUser.role} • {!selectedUser.online && selectedUser.lastSeen ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChatSearch((current) => {
                        if (current) setInChatSearch('');
                        return !current;
                      });
                    }}
                    className={`p-2 rounded-xl transition ${showChatSearch ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                    aria-label="Search in chat"
                    title="Search in chat"
                  >
                    <Search size={16} />
                  </button>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className={`p-2 rounded-xl transition ${showDetails ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {showChatSearch && (
                <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-4 py-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      autoFocus
                      value={inChatSearch}
                      onChange={(e) => setInChatSearch(e.target.value)}
                      placeholder="Search messages..."
                      className="w-full rounded-xl border border-slate-100 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </div>
                  {inChatSearch.trim() && (
                    <span className="shrink-0 text-[10px] font-bold text-slate-400">
                      {filteredMessages.length} found
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setInChatSearch('');
                      setShowChatSearch(false);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Close search"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Messages scrollarea */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-slate-50/20 p-4 space-y-4">
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
                      const mine = isMe(msg.sender_id);

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
                              <p className="whitespace-pre-wrap break-words">{renderTicketLinkedText(msg.content ?? msg.text)}</p>
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
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-600 inline" />
                                  ) : msg.is_delivered ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-slate-400 inline" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5 text-slate-400 inline" />
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
              <div className="relative border-t border-slate-100 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pt-4 bg-white shrink-0 z-10">
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                    <div className="absolute bottom-16 left-4 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Emoji</span>
                        <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-slate-655 text-xs">✕</button>
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
                  <div className="flex gap-2 w-full min-w-0">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 min-w-0 w-full rounded-2xl border border-blue-50 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-400"
                    />
                    <button
                      onClick={submitEdit}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shrink-0"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMessage(null)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="flex-1 min-w-0 flex items-center rounded-full border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-1.5 transition-all focus-within:border-blue-300 focus-within:bg-white">
                      <button className="text-slate-400 hover:text-slate-600 pr-2 shrink-0" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
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
                        className="flex-1 min-w-0 w-full border-none bg-transparent py-1 text-xs font-semibold outline-none text-slate-800 placeholder-slate-400"
                      />
                      <label className="text-slate-400 hover:text-slate-600 pl-2 cursor-pointer transition shrink-0">
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
          <aside className="hidden xl:flex w-[280px] flex-col border-l border-slate-100 bg-slate-50/10 shrink-0">
            <div className="p-6 text-center border-b border-slate-100 bg-white shrink-0">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-black text-white shadow-md">
                {(selectedUser.name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <h4 className="mt-3 text-xs font-bold text-slate-900">{selectedUser.name}</h4>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-0.5">{selectedUser.role}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-1">{selectedUser.email}</p>
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
                      <span className="font-bold text-slate-400">{(isMe(m.sender_id)) ? 'Me: ' : 'Them: '}</span>
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
            ...(isMe(contextMenu.message.sender_id) && !contextMenu.message.is_deleted
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
                <h3 className="text-sm font-black text-slate-900 uppercase">Schedule Meeting</h3>
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
                <div className="space-y-1">
                  <label className="text-slate-400">Meeting Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['online', 'offline'].map((mode) => (
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
                      placeholder="Conference hall / office / campus"
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
                        recipientIds: [selectedUser.id],
                      });
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

      <AnimatePresence>
        {showBulkMeetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase">Bulk Meeting Scheduler</h3>
                <button
                  onClick={() => setShowBulkMeetModal(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs font-semibold text-slate-700">
                <div className="space-y-1">
                  <label className="text-slate-400">Audience</label>
                  <CustomSelect
          onChange={setBulkTargetType}
                    value={bulkTargetType}
                    options={[
                    { value: "class_teachers", label: "Class teachers" },
                    { value: "section_parents", label: "Section parents" },
                    { value: "class_parents", label: "Class parents" },
                  ]}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Class</label>
                    <CustomSelect
          onChange={setBulkClassId}
                      value={bulkClassId}
                      options={[
                      { value: "", label: "Select class" },
                    ]}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Section</label>
                    <CustomSelect
          onChange={setBulkSectionId}
                      value={bulkSectionId}
                      options={[
                      { value: "", label: "Select section" },
                    ]}
                      className="w-full"
                    />
                  </div>
                </div>
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
                <div className="grid grid-cols-2 gap-3">
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
                  <div className="space-y-1">
                    <label className="text-slate-400">Meeting Type</label>
                    <CustomSelect
          onChange={setMeetMode}
                      value={meetMode}
                      options={[
                      { value: "online", label: "Online" },
                      { value: "offline", label: "Offline" },
                    ]}
                      className="w-full"
                    />
                  </div>
                </div>
                {meetMode === 'online' ? (
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-slate-400">Meeting Location</label>
                    <input
                      type="text"
                      value={meetLocation}
                      onChange={(e) => setMeetLocation(e.target.value)}
                      placeholder="Conference hall / office / campus"
                      className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-400"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  disabled={loadingMeetingOptions}
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
                        scopeType: bulkTargetType,
                        classId: bulkClassId || null,
                        sectionId: bulkSectionId || null,
                      });
                      setShowBulkMeetModal(false);
                      showToast('Bulk meeting requests created successfully!', 'success');
                    } catch (err) {
                      showToast('Failed to create bulk meeting requests', 'error');
                    }
                  }}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Create Bulk Meeting
                </button>
                <button
                  onClick={() => setShowBulkMeetModal(false)}
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
                      if (!selectedUser) return;
                      await api.patch(`/chat/messages/${selectedUser.id}/read`).catch(() => { });
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
