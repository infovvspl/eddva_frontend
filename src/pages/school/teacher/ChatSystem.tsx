import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, User, Headphones, Smile, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import SearchBar from '@/components/school/SearchBar';
import Tabs from '@/components/school/Tabs';
import api from '@/lib/api/school-client';
import { createChatSocket } from '@/lib/chat-socket';
import { useAuth } from '@/context/SchoolAuthContext';
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
};

// Each tab maps to the role of the people a teacher talks to.
const ROLE_BY_TAB: Record<string, string> = {
  students: 'STUDENT',
  parents: 'PARENT',
  staff: 'INSTITUTE_ADMIN',
};

const ChatSystem: React.FC = () => {
  const { user } = useAuth();
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<string>('students');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleUnavailableAction = (action: string) => {
    window.alert(`${action} is not connected yet.`);
  };

  // Merge the directory of users (who you can message) with existing
  // conversations (last message + unread), keyed by the peer's user id.
  const fetchGroup = useCallback(async (role: string): Promise<Contact[]> => {
    const [usersRes, convRes] = await Promise.all([
      api.get('/chat/users', { params: { role } }),
      api.get('/chat/conversations', { params: { role } }),
    ]);
    const users: any[] = usersRes.data?.data ?? [];
    const conversations: any[] = convRes.data?.data ?? [];
    const convByPeer = new Map<string, any>();
    conversations.forEach((c) => convByPeer.set(c.peer_id, c));

    return users
      .filter((u) => u.id !== user?.id)
      .map((u) => {
        const conv = convByPeer.get(u.id);
        return {
          id: u.id,
          name: u.name || 'Unknown',
          email: u.email,
          online: false,
          time: conv?.created_at ? new Date(conv.created_at).toLocaleDateString() : '',
          lastMessage: conv?.last_message || 'No messages yet',
          unread: Number(conv?.unread_count || 0),
        };
      });
  }, [user?.id]);

  // Only load the tab the teacher is actually looking at (lazy) — fetching all
  // three groups up front was the source of the slow load.
  const loadActiveTab = useCallback(
    async (showSpinner = false) => {
      const role = ROLE_BY_TAB[activeTab] ?? 'STUDENT';
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

  useEffect(() => {
    void loadActiveTab(true);
  }, [loadActiveTab]);

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
    api.patch(`/chat/messages/${contact.id}/read`).catch(() => {});
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime: keep latest callbacks in refs so the socket mounts only once.
  const activeContactRef = useRef<Contact | null>(null);
  const fetchMessagesRef = useRef(fetchMessages);
  const loadActiveTabRef = useRef(loadActiveTab);
  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);
  useEffect(() => { fetchMessagesRef.current = fetchMessages; }, [fetchMessages]);
  useEffect(() => { loadActiveTabRef.current = loadActiveTab; }, [loadActiveTab]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = createChatSocket();
    const join = () => socket.emit('join_user', user.id);
    socket.on('connect', () => { join(); setSocketConnected(true); });
    socket.on('disconnect', () => setSocketConnected(false));
    join();
    socket.on('direct_message', (msg: any) => {
      const peer = activeContactRef.current;
      if (peer && (msg.sender_id === peer.id || msg.receiver_id === peer.id)) {
        void fetchMessagesRef.current(peer.id);
      }
      void loadActiveTabRef.current(false);
    });
    return () => { socket.disconnect(); };
  }, [user?.id]);

  // Fallback polling ONLY when the realtime socket is down — otherwise the
  // socket pushes updates and we avoid hammering the DB with repeat queries.
  useEffect(() => {
    if (!activeContact || socketConnected) return;
    const interval = window.setInterval(() => {
      void fetchMessages(activeContact.id);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [activeContact, fetchMessages, socketConnected]);

  useEffect(() => {
    if (socketConnected) return;
    const interval = window.setInterval(() => {
      void loadActiveTab(false);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadActiveTab, socketConnected]);

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || !activeContact) return;
    setMessage('');
    try {
      const res = await api.post('/chat/messages', {
        receiverId: activeContact.id,
        content: trimmed,
      });
      const created = res.data?.data;
      setMessages((prev) => [
        ...prev,
        {
          id: created?.id ?? Date.now(),
          text: created?.content ?? created?.text ?? trimmed,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'me',
        },
      ]);
      void loadActiveTab(false);
    } catch (err) {
      console.error('Failed to send message', err);
      window.alert('Failed to send message');
      setMessage(trimmed);
    }
  };

  const renderContactList = (list: Contact[]) => {
    if (loadingContacts) {
      return (
        <div className="chat__contacts">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="chat__contact" style={{ pointerEvents: 'none' }}>
              <div className="chat__contact-avatar" style={{ background: '#e2e8f0', color: 'transparent' }}>--</div>
              <div className="chat__contact-info" style={{ opacity: 0.5 }}>
                <div className="chat__contact-header">
                  <span className="chat__contact-name" style={{ background: '#e2e8f0', color: 'transparent', borderRadius: 6 }}>Loading name</span>
                </div>
                <div className="chat__contact-footer">
                  <span className="chat__contact-msg" style={{ background: '#eef2f7', color: 'transparent', borderRadius: 6 }}>Loading…</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    const filtered = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (filtered.length === 0) {
      return (
        <div className="chat__empty-messages">
          <p>No contacts found.</p>
        </div>
      );
    }
    return (
      <div className="chat__contacts">
        {filtered.map((contact) => (
          <div
            key={contact.id}
            className={`chat__contact ${activeContact?.id === contact.id ? 'chat__contact--active' : ''}`}
            onClick={() => openConversation(contact)}
          >
            <div className="chat__contact-avatar">
              {contact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              {contact.online && <span className="chat__online-dot" />}
            </div>
            <div className="chat__contact-info">
              <div className="chat__contact-header">
                <span className="chat__contact-name">{contact.name}</span>
                <span className="chat__contact-time">{contact.time}</span>
              </div>
              <div className="chat__contact-footer">
                <span className="chat__contact-msg">{contact.lastMessage}</span>
                {contact.unread > 0 && <span className="chat__unread-badge">{contact.unread}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chat">
      <div className="chat__sidebar">
        <div className="chat__sidebar-header">
          <h3>Messages</h3>
          <button className="chat__icon-btn" type="button" onClick={() => handleUnavailableAction('Chat options')}><MoreVertical size={18} /></button>
        </div>
        <div className="chat__sidebar-search">
          <SearchBar value={search} onChange={setSearch} placeholder="Search conversations..." />
        </div>
        <Tabs
          onChange={setActiveTab}
          tabs={[
            { id: 'students', label: 'Students', icon: <Users size={14} />, content: renderContactList(contacts) },
            { id: 'parents', label: 'Parents', icon: <User size={14} />, content: renderContactList(contacts) },
            { id: 'staff', label: 'Staff', icon: <Headphones size={14} />, content: renderContactList(contacts) },
          ]}
        />
      </div>

      <div className="chat__main">
        {activeContact ? (
          <>
            <div className="chat__header">
              <div className="chat__header-left">
                <div className="chat__header-avatar">
                  {activeContact.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  {activeContact.online && <span className="chat__online-dot" />}
                </div>
                <div>
                  <h3 className="chat__header-name">{activeContact.name}</h3>
                  <span className="chat__header-status">{activeContact.email || ''}</span>
                </div>
              </div>
              <div className="chat__header-actions">
                <button className="chat__icon-btn" type="button" onClick={() => handleUnavailableAction('Voice call')}><Phone size={18} /></button>
                <button className="chat__icon-btn" type="button" onClick={() => handleUnavailableAction('Video call')}><Video size={18} /></button>
                <button className="chat__icon-btn" type="button" onClick={() => handleUnavailableAction('More chat actions')}><MoreVertical size={18} /></button>
              </div>
            </div>

            <div className="chat__messages">
              {messages.length > 0 ? messages.map((msg) => (
                <div key={msg.id} className={`chat__message chat__message--${msg.sender}`}>
                  <div className="chat__message-bubble">
                    <p>{msg.text}</p>
                    <span className="chat__message-time">{msg.time}</span>
                  </div>
                </div>
              )) : (
                <div className="chat__empty-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat__input-area">
              <button className="chat__icon-btn" type="button" onClick={() => handleUnavailableAction('Attachments')}><Paperclip size={20} /></button>
              <div className="chat__input-wrapper">
                <input
                  type="text"
                  className="chat__input"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="chat__icon-btn" type="button" onClick={() => handleUnavailableAction('Emoji picker')}><Smile size={20} /></button>
              </div>
              <button className="chat__send-btn" disabled={!message.trim()} onClick={handleSendMessage}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="chat__empty">
            <Users size={48} className="chat__empty-icon" />
            <h3>Select a conversation</h3>
            <p>Choose a contact from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;
