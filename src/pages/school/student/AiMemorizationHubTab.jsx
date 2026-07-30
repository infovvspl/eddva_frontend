import React, { useState, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { Brain, Sparkles, BookOpen, Layers, RotateCcw, Lightbulb, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

export default function AiMemorizationHubTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [flippedCardId, setFlippedCardId] = useState(null);

  useEffect(() => {
    const fetchMemorization = async () => {
      try {
        setLoading(true);
        const res = await api.get('/gamification/ai-memorization');
        const data = res?.data?.data ?? res?.data ?? [];
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load AI memorization items:', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMemorization();
  }, []);

  const handleFlip = (id) => {
    soundEngine.playButtonClick();
    setFlippedCardId(flippedCardId === id ? null : id);
  };

  const filteredItems = items.filter((i) => i.item_type !== 'FLASHCARD' && (activeFilter === 'ALL' || i.item_type === activeFilter));

  return (
    <div className="space-y-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-300">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            AI Powered Concept Retention
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">AI Memorization Engine</h2>
          <p className="text-xs text-slate-500 font-medium">Detect weak concepts & generate personalized mnemonics, stories, and formulas.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
        {[
          { key: 'ALL', label: 'All Items', icon: Layers },
          { key: 'MNEMONIC', label: 'Mnemonics', icon: Lightbulb },
          { key: 'STORY', label: 'Memory Stories', icon: FileText },
          { key: 'FORMULA', label: 'Formulas', icon: RotateCcw },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeFilter === tab.key
                  ? 'bg-white text-indigo-600 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Memorization Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <Brain className="mx-auto h-8 w-8 animate-pulse text-indigo-500" />
          <p className="mt-2 text-xs font-bold text-slate-400">AI is analyzing weak concepts & building retention tools...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold text-slate-400">No memorization items found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const content = typeof item.content_json === 'string' ? JSON.parse(item.content_json) : (item.content_json || {});
            const isFlipped = flippedCardId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleFlip(item.id)}
                className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {item.subject_name} • {item.topic_name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Weak Score: <strong className="text-amber-500">{item.weak_score}%</strong>
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{item.concept_name}</h3>

                {/* Content Box */}
                <div className="min-h-[100px] rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
                  {item.item_type === 'FLASHCARD' && (
                    <div className="text-xs font-bold leading-relaxed text-slate-700 dark:text-slate-200">
                      {isFlipped ? (
                        <div className="text-indigo-600 dark:text-indigo-400">
                          <strong className="block text-[10px] uppercase text-indigo-400 mb-1">Answer / Back:</strong>
                          {content.back || 'Snells Law formula'}
                        </div>
                      ) : (
                        <div>
                          <strong className="block text-[10px] uppercase text-slate-400 mb-1">Front / Question:</strong>
                          {content.front || item.concept_name}
                        </div>
                      )}
                    </div>
                  )}

                  {item.item_type === 'MNEMONIC' && (
                    <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      <p className="text-sm font-black italic mb-1">"{content.mnemonic}"</p>
                      <p className="text-[11px] font-medium text-slate-500">{content.meaning}</p>
                    </div>
                  )}

                  {item.item_type === 'STORY' && (
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{content.story}"
                    </p>
                  )}

                  {item.item_type === 'FORMULA' && (
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800 dark:text-white">{content.title}</p>
                      {Array.isArray(content.formulas) &&
                        content.formulas.map((f, idx) => (
                          <p key={idx} className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                            {f}
                          </p>
                        ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  <span>{isFlipped ? 'Tap to flip back' : 'Tap to reveal answer / details'}</span>
                  <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
