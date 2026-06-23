import React from 'react';
import { X } from 'lucide-react';

export default function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  if (!url) return null;
  
  const isMp4 = url.endsWith('.mp4') || url.includes('.m3u8');
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  const isEmbeddable = isMp4 || isYoutube;

  let embedUrl = url;
  if (isYoutube && url.includes('watch?v=')) {
    embedUrl = url.replace('watch?v=', 'embed/');
  } else if (isYoutube && url.includes('youtu.be/')) {
    embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate pr-4">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {isEmbeddable ? (
            isMp4 ? (
              <video src={url} controls className="w-full h-full outline-none" autoPlay playsInline />
            ) : (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <p>This video source cannot be embedded directly in the browser.</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noreferrer" 
                className="px-6 py-2.5 font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                onClick={onClose}
              >
                Watch in New Tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
