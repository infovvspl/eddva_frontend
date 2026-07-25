import React from 'react';
import { motion } from 'framer-motion';

const DECORATION_EMOJIS = {
  football: '⚽',
  trophy: '🏆',
  whistle: '🏀',
  star: '🌟',
  leaf: '🍃',
  confetti: '🎉',
  sparkle: '✨',
  brush: '🖌️',
  palette: '🎨',
  clock: '⏰',
  check: '✅',
  sun: '☀️',
  cloud: '☁️',
  atom: '🔬',
  rocket: '🚀',
  tent: '⛺',
  flag: '🇮🇳',
  kite: '🪁',
  book: '📚',
  pencil: '✏️',
  diya: '🪔',
  lantern: '🏮',
  lamp: '💡',
  snowflake: '❄️',
  tree: '🎄'
};

export const HeroBackground = ({ decorations }) => {
  const items = Array.isArray(decorations) ? decorations : [];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Subtle grid background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Sports Running Track lines for July */}
      {items.some(d => d.type === 'football') && (
        <svg className="absolute inset-0 w-full h-full text-blue-500/[0.04] pointer-events-none" viewBox="0 0 800 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M -50,110 C 200,60 600,160 850,90" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6" />
          <path d="M -50,130 C 200,80 600,180 850,110" stroke="currentColor" strokeWidth="3" strokeDasharray="6 6" />
        </svg>
      )}

      {/* Dynamic floating real emoji icons */}
      {items.map((item, idx) => {
        const emoji = DECORATION_EMOJIS[item.type];
        if (!emoji) return null;
        
        return (
          <motion.div
            key={idx}
            initial={{ y: 0, x: 0, rotate: 0 }}
            animate={{ 
              y: [0, -12, 8, -8, 0],
              x: [0, 6, -8, 5, 0],
              rotate: [0, 10, -8, 6, 0],
              scale: [1, 1.1, 0.95, 1.05, 1]
            }}
            transition={{
              duration: 5.5 + (idx % 3) * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: idx * 0.3
            }}
            className="absolute text-xl sm:text-2xl md:text-3xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.18)] opacity-90 hover:opacity-100 transition-opacity pointer-events-none select-none z-10"
            style={item.position}
          >
            <span className="inline-block transform hover:scale-110 transition-transform">
              {emoji}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
