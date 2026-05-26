import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { Bot, Send, User, Sparkles, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm your AI study assistant. I can help you solve doubts, explain complex topics, or generate study notes. How can I help you today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !image) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      image: imagePreview
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImage(null);
    setImagePreview(null);
    setLoading(true);

    try {
      // Use FormData to support image upload for doubt resolution
      const formData = new FormData();
      formData.append('question', input);
      formData.append('mode', 'detailed');
      if (image) {
        formData.append('image', image);
      }

      const res = await api.post('/ai/doubt/resolve', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = res.data;
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: data.explanation || data.answer || data.message || "I've analyzed your question.",
        type: 'doubt_resolution',
        steps: data.steps
      }]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 p-6 dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-purple-500/20">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Eddva AI Tutor</h2>
          <p className="text-xs font-semibold text-slate-500">Always here to help you learn</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm",
                msg.role === 'user' 
                  ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" 
                  : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              )}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={cn(
                "flex max-w-[80%] flex-col gap-2 rounded-2xl p-4 text-sm font-medium leading-relaxed",
                msg.role === 'user'
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : msg.isError
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50"
                    : "bg-white text-slate-700 shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              )}>
                {msg.image && (
                  <img src={msg.image} alt="User upload" className="mb-2 max-h-64 rounded-xl object-contain" />
                )}
                
                {msg.content && <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />}
                
                {msg.steps && msg.steps.length > 0 && (
                  <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-500" /> Step-by-step Solution
                    </h4>
                    <ol className="list-decimal pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                      {msg.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex w-full gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Bot size={20} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-slate-900">
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
        <div className="mx-auto max-w-3xl">
          {imagePreview && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 pr-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <img src={imagePreview} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Image attached</span>
              <button onClick={removeImage} className="ml-2 rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-700 dark:hover:bg-rose-900/30">
                <X size={14} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
            <div className="relative flex-1">
              <label htmlFor="ai-image-upload" className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                <ImageIcon size={20} />
                <input 
                  id="ai-image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </label>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask a question or share a doubt..."
                className="w-full resize-none rounded-2xl border-0 bg-slate-50 py-4 pl-14 pr-4 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:opacity-50 dark:bg-slate-950 dark:text-white dark:ring-slate-800 dark:focus:ring-indigo-500"
                rows={1}
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={(!input.trim() && !image) || loading}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            AI can make mistakes. Verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}
