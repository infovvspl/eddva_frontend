import React from 'react';
import { ArenaBackdrop } from '../quiz-rush/ArenaKit';
import useArenaDark from './useArenaDark';

// Wraps a game in the Quiz Rush arena atmosphere (aurora, perspective floor,
// scanlines) and switches its `dark:` styles on. The wrapper deliberately does
// not use .qr-arena's typography, so the game keeps its own fonts and layout.
// The CSS variables the backdrop reads are declared on `.qr-arena`, which is
// why that class is kept and the font/colour it sets are reset to inherit.
export default function ArenaDarkFrame({ children }) {
  useArenaDark();

  return (
    <div className="qr-arena relative" style={{ fontFamily: 'inherit', color: 'inherit' }}>
      <ArenaBackdrop />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
