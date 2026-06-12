/* ============================================================
 * preview.js — Slide Preview Renderer
 * ============================================================
 * Renders slide previews into the #slide-canvas element,
 * manages the thumbnail strip, and handles slide navigation.
 *
 * Load order: 2nd (depends on: api.js for THEMES reference)
 * ============================================================ */

window.SlidePreview = {

  /** Zero-based index of the currently displayed slide */
  currentSlideIndex: 0,

  /* ----------------------------------------------------------
   * Main slide rendering
   * ---------------------------------------------------------- */

  /**
   * Render a single slide into the #slide-canvas element.
   *
   * @param {Object} slideData — Slide data object
   * @param {string} themeKey  — Theme key from window.THEMES
   */
  renderSlide(slideData, themeKey) {
    const canvas = document.getElementById('slide-canvas');
    if (!canvas || !slideData) return;

    const theme = window.THEMES[themeKey] || window.THEMES['dark-professional'];

    // Clear previous content
    canvas.innerHTML = '';

    // Flat background — matches the clean exported deck (pptExport.js).
    canvas.style.background = `#${theme.bgGradient[0]}`;
    canvas.style.fontFamily = theme.fontBody;
    canvas.style.position = 'relative';
    canvas.style.overflow = 'hidden';

    // Dispatch to the correct layout renderer
    switch (slideData.type) {
      case 'title':
        this._renderTitleSlide(canvas, slideData, theme);
        break;
      case 'summary':
        this._renderSummarySlide(canvas, slideData, theme);
        break;
      case 'content':
      default:
        this._renderContentSlide(canvas, slideData, theme);
        break;
    }
  },

  /* --- Title Slide ----------------------------------------- */

  _renderTitleSlide(canvas, slide, theme) {
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const hasImg = !!imgSrc;
    const textW = hasImg ? '54%' : '86%';

    // Left accent bar
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '0', top: '0', bottom: '0', width: '1.8%', background: '#' + theme.accent }
    }));

    // Eyebrow accent line
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '7%', top: '35%', width: '9%', height: '4px', background: '#' + theme.accent, borderRadius: '2px' }
    }));

    // Title (left-aligned)
    canvas.appendChild(this._el('div', {
      text: slide.title || '',
      styles: {
        position: 'absolute', left: '7%', top: '38%', width: textW,
        fontSize: '2.3em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#' + theme.textColor, lineHeight: '1.15', zIndex: '2'
      }
    }));

    if (slide.subtitle) {
      canvas.appendChild(this._el('div', {
        text: slide.subtitle,
        styles: {
          position: 'absolute', left: '7.2%', top: '68%', width: textW,
          fontSize: '1.1em', color: '#' + theme.subtextColor, lineHeight: '1.4', zIndex: '2'
        }
      }));
    }

    // Clean image block on the right
    if (hasImg) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute', right: '4%', top: '16%', width: '29%', height: '68%',
          borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: '2',
          background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:block;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);
      canvas.appendChild(imgWrap);
    }
  },

  /* --- Content Slide --------------------------------------- */

  // Image layout configs [textWidth%, imgRight%, imgTop%, imgWidth%]
  _IMG_SIZES: {
    small:  { textW: '70%', right: '2%',  top: '18%', width: '22%' },
    medium: { textW: '55%', right: '4%',  top: '15%', width: '34%' },
    large:  { textW: '44%', right: '2%',  top: '8%',  width: '46%' },
    full:   { textW: '85%', right: null,  top: null,  width: null  },
    none:   { textW: '90%', right: null,  top: null,  width: null  }
  },

  _renderContentSlide(canvas, slide, theme) {
    const sizeKey = slide.imageSize || 'medium';
    const layout  = this._IMG_SIZES[sizeKey] || this._IMG_SIZES.medium;

    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');

    // Full-background mode: image behind everything with overlay
    if (sizeKey === 'full' && imgSrc) {
      const bgImg = this._el('div', {
        styles: {
          position: 'absolute', inset: '0',
          background: `url('${imgSrc}') center/cover no-repeat`
        }
      });
      canvas.appendChild(bgImg);
      const overlay = this._el('div', {
        styles: { position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.55)' }
      });
      canvas.appendChild(overlay);
    }

    // Title
    const title = this._el('div', {
      text: slide.title || '',
      styles: {
        position: 'absolute',
        left: '5%', top: '7%',
        width: layout.textW,
        fontSize: '1.55em',
        fontWeight: '700',
        fontFamily: theme.fontHead,
        color: '#' + theme.textColor,
        lineHeight: '1.2',
        zIndex: '2'
      }
    });
    canvas.appendChild(title);

    // Thin accent underline beneath the title (matches export)
    const underline = this._el('div', {
      styles: {
        position: 'absolute',
        left: '5%', top: '19%',
        width: '6%', height: '3px',
        background: '#' + theme.accent,
        borderRadius: '2px',
        zIndex: '2'
      }
    });
    canvas.appendChild(underline);

    // Bullets
    const bullets = slide.bullets || [];
    if (bullets.length > 0) {
      // Scale font: 5 bullets of ~15 words each ≈ 75 words ≈ 400 chars — comfortable at 0.88em
      const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
      const bulletFontSize = totalChars > 700 ? '0.72em' : totalChars > 450 ? '0.80em' : '0.88em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.45em' : '0.6em';

      const list = this._el('div', {
        styles: {
          position: 'absolute',
          left: '5%', top: '22%', bottom: '3%',
          width: layout.textW,
          display: 'flex',
          flexDirection: 'column',
          gap: bulletGap,
          zIndex: '2',
          overflow: 'hidden'
        }
      });

      bullets.forEach(text => {
        const row = this._el('div', {
          styles: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5em',
            fontSize: bulletFontSize,
            lineHeight: '1.4',
            color: '#' + theme.textColor
          }
        });
        const dot = this._el('span', {
          text: '●',
          styles: {
            color: '#' + theme.accent,
            fontSize: '0.6em',
            marginTop: '0.45em',
            flexShrink: '0'
          }
        });
        row.appendChild(dot);
        row.appendChild(this._el('span', { text: text || '' }));
        list.appendChild(row);
      });

      canvas.appendChild(list);
    }

    // Image (skip for 'none' or 'full' modes, or when no src)
    if (sizeKey !== 'none' && sizeKey !== 'full' && imgSrc && layout.width) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          right: layout.right,
          top: layout.top,
          width: layout.width,
          maxWidth: `calc(100% - ${layout.right} - 2%)`,
          maxHeight: '78%',
          // Fill mode keeps a tidy 4:3 frame; Fit mode gives the whole image more room.
          aspectRatio: fit === 'contain' ? '16/11' : '4/3',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          cursor: 'pointer',
          zIndex: '3',
          background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });

      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:block;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      // ── Inline edit overlay (appears on hover) ──────────────
      const overlay = document.createElement('div');
      overlay.className = 'img-edit-overlay';
      overlay.innerHTML = `
        <div class="img-edit-toolbar">
          <button class="img-edit-btn" data-action="smaller" title="Make smaller">◀ Smaller</button>
          <button class="img-edit-btn img-edit-btn--replace" data-action="replace" title="Replace image">🔍 Replace</button>
          <button class="img-edit-btn" data-action="larger" title="Make larger">Larger ▶</button>
        </div>`;
      // Show/hide overlay on parent hover (JS fallback for browsers without :has())
      imgWrap.addEventListener('mouseenter', () => {
        overlay.style.opacity = '1';
        overlay.style.background = 'rgba(0,0,0,0.48)';
        overlay.style.pointerEvents = 'auto';
      });
      imgWrap.addEventListener('mouseleave', () => {
        overlay.style.opacity = '0';
        overlay.style.background = 'rgba(0,0,0,0)';
        overlay.style.pointerEvents = 'none';
      });

      imgWrap.appendChild(overlay);

      // Resize helpers
      const sizeDown = { full: 'large', large: 'medium', medium: 'small', small: 'none' };
      const sizeUp   = { none: 'small', small: 'medium', medium: 'large', large: 'full' };

      overlay.querySelector('[data-action="smaller"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const cur  = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
        const next = sizeDown[cur] || 'none';
        this._applyImageSize(next);
      });
      overlay.querySelector('[data-action="larger"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const cur  = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
        const next = sizeUp[cur] || 'full';
        this._applyImageSize(next);
      });
      overlay.querySelector('[data-action="replace"]').addEventListener('click', (e) => {
        e.stopPropagation();
        // Scroll edit panel to the image search section and focus the input
        const panel = document.getElementById('edit-panel');
        const searchInput = document.getElementById('edit-image-search');
        if (searchInput) {
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => searchInput.focus(), 300);
        }
      });

      canvas.appendChild(imgWrap);
    }
  },

  /* --- Summary Slide --------------------------------------- */

  _renderSummarySlide(canvas, slide, theme) {
    // Small image in top-right corner (if available)
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    if (imgSrc) {
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          right: '3%', top: '12%',
          width: '24%', maxHeight: '35%',
          aspectRatio: '4/3',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          zIndex: '2'
        }
      });
      const objPos = slide.imagePosition || 'center center';
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = slide.imageSearchTerm || '';
      img.style.cssText = `width:100%;height:100%;object-fit:cover;object-position:${objPos};display:block;`;
      img.onerror = () => { imgWrap.style.display = 'none'; };
      imgWrap.appendChild(img);

      // Inline edit overlay on summary image too
      const overlay = document.createElement('div');
      overlay.className = 'img-edit-overlay';
      overlay.innerHTML = `<div class="img-edit-toolbar">
        <button class="img-edit-btn" data-action="smaller" title="Smaller">◀ Smaller</button>
        <button class="img-edit-btn img-edit-btn--replace" data-action="replace" title="Replace">🔍 Replace</button>
        <button class="img-edit-btn" data-action="larger" title="Larger">Larger ▶</button>
      </div>`;
      imgWrap.addEventListener('mouseenter', () => { overlay.style.opacity='1'; overlay.style.background='rgba(0,0,0,0.48)'; overlay.style.pointerEvents='auto'; });
      imgWrap.addEventListener('mouseleave', () => { overlay.style.opacity='0'; overlay.style.background='rgba(0,0,0,0)'; overlay.style.pointerEvents='none'; });
      const sizeDown = { full:'large', large:'medium', medium:'small', small:'none' };
      const sizeUp   = { none:'small', small:'medium', medium:'large', large:'full' };
      overlay.querySelector('[data-action="smaller"]').addEventListener('click', e => { e.stopPropagation(); this._applyImageSize(sizeDown[slide.imageSize||'medium']||'none'); });
      overlay.querySelector('[data-action="larger"]').addEventListener('click',  e => { e.stopPropagation(); this._applyImageSize(sizeUp[slide.imageSize||'medium']||'full'); });
      overlay.querySelector('[data-action="replace"]').addEventListener('click', e => { e.stopPropagation(); const s=document.getElementById('edit-image-search'); if(s){s.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>s.focus(),300);} });
      imgWrap.appendChild(overlay);
      canvas.appendChild(imgWrap);
    }

    // Title (left-aligned, matches export)
    const title = this._el('div', {
      text: slide.title || 'Key Takeaways',
      styles: {
        position: 'absolute',
        left: '6%', top: '8%',
        width: imgSrc ? '60%' : '86%',
        fontSize: '1.9em',
        fontWeight: '700',
        fontFamily: theme.fontHead,
        color: '#' + theme.textColor,
        textAlign: 'left',
        lineHeight: '1.2'
      }
    });
    canvas.appendChild(title);

    // Thin accent underline
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '6%', top: '24%', width: '6%', height: '3px', background: '#' + theme.accent, borderRadius: '2px' }
    }));

    // Bullet points centered
    const bullets = slide.bullets || [];
    if (bullets.length > 0) {
      const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
      const bulletFontSize = totalChars > 700 ? '0.74em' : totalChars > 450 ? '0.83em' : '0.92em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.48em' : '0.6em';

      const hasImg = !!(slide.imageBase64 || slide.imageUrl);
      const list = this._el('div', {
        styles: {
          position: 'absolute',
          left: '8%',
          right: hasImg ? '30%' : '8%',
          top: '22%', bottom: '14%',
          display: 'flex',
          flexDirection: 'column',
          gap: bulletGap,
          overflow: 'hidden'
        }
      });

      bullets.forEach(text => {
        const row = this._el('div', {
          styles: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.55em',
            fontSize: bulletFontSize,
            lineHeight: '1.4',
            color: '#' + theme.textColor
          }
        });

        const dot = this._el('span', {
          text: '✦',
          styles: {
            color: '#' + theme.accent,
            fontSize: '0.7em',
            marginTop: '0.35em',
            flexShrink: '0'
          }
        });

        const txt = this._el('span', { text: text || '' });
        row.appendChild(dot);
        row.appendChild(txt);
        list.appendChild(row);
      });

      canvas.appendChild(list);
    }

    // "Thank You!" footer
    const thanks = this._el('div', {
      text: 'Thank You!',
      styles: {
        position: 'absolute',
        left: '5%', right: '5%',
        bottom: '8%',
        fontSize: '1.5em',
        fontWeight: '700',
        fontFamily: theme.fontHead,
        color: '#' + theme.accent,
        textAlign: 'center'
      }
    });
    canvas.appendChild(thanks);
  },

  /* ----------------------------------------------------------
   * Thumbnail strip
   * ---------------------------------------------------------- */

  /**
   * Render clickable thumbnails for every slide.
   *
   * @param {Array}  slides   — Array of slide data objects
   * @param {string} themeKey — Theme key
   */
  renderThumbnails(slides, themeKey) {
    const strip = document.getElementById('slide-thumbnails');
    if (!strip || !slides) return;

    const theme = window.THEMES[themeKey] || window.THEMES['dark-professional'];
    strip.innerHTML = '';

    slides.forEach((slide, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb' + (idx === this.currentSlideIndex ? ' active' : '');
      thumb.dataset.index = idx;
      thumb.title = `Slide ${idx + 1}: ${slide.title || ''}`;

      // Mini preview styling
      thumb.style.background = `linear-gradient(135deg, #${theme.bgGradient[0]}, #${theme.bgGradient[1]})`;

      // Slide number badge
      const badge = this._el('span', {
        text: String(idx + 1),
        styles: {
          position: 'absolute',
          top: '4px', left: '4px',
          background: '#' + theme.accent,
          color: '#fff',
          fontSize: '0.55em',
          fontWeight: '700',
          padding: '1px 5px',
          borderRadius: '4px',
          lineHeight: '1.4'
        }
      });
      thumb.style.position = 'relative';
      thumb.appendChild(badge);

      // Mini title text
      const miniTitle = this._el('span', {
        text: this._truncate(slide.title || '', 28),
        styles: {
          position: 'absolute',
          left: '6px', right: '6px',
          bottom: '6px',
          fontSize: '0.5em',
          color: '#' + theme.textColor,
          lineHeight: '1.25',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }
      });
      thumb.appendChild(miniTitle);

      // Click handler
      thumb.addEventListener('click', () => this.goToSlide(idx));

      strip.appendChild(thumb);
    });
  },

  /* ----------------------------------------------------------
   * Navigation
   * ---------------------------------------------------------- */

  /**
   * Navigate to a specific slide by index.
   * @param {number} index — Zero-based slide index
   */
  goToSlide(index) {
    const slides = (window.presentationData && window.presentationData.slides) || [];
    if (slides.length === 0) return;

    // Clamp index
    index = Math.max(0, Math.min(index, slides.length - 1));
    this.currentSlideIndex = index;

    // Re-render main preview
    this.renderSlide(slides[index], window.presentationData.theme);

    // Update active thumbnail
    const thumbs = document.querySelectorAll('.slide-thumb');
    thumbs.forEach((t, i) => t.classList.toggle('active', i === index));

    // Scroll active thumbnail into view
    const activeThumb = thumbs[index];
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // Update counter
    this.updateCounter();

    // Load slide into editor
    if (window.SlideEditor) {
      window.SlideEditor.loadSlide(slides[index]);
    }
  },

  /** Go to the next slide */
  nextSlide() {
    const slides = (window.presentationData && window.presentationData.slides) || [];
    if (this.currentSlideIndex < slides.length - 1) {
      this.goToSlide(this.currentSlideIndex + 1);
    }
  },

  /** Go to the previous slide */
  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.goToSlide(this.currentSlideIndex - 1);
    }
  },

  /** Update the "Slide X of Y" counter text */
  updateCounter() {
    const counter = document.getElementById('slide-counter');
    if (!counter) return;

    const total = (window.presentationData && window.presentationData.slides)
      ? window.presentationData.slides.length
      : 0;
    counter.textContent = `Slide ${this.currentSlideIndex + 1} of ${total}`;
  },

  /* ----------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------- */

  /**
   * Quick element factory.
   * @param {string} tag
   * @param {{ text?: string, styles?: Object }} opts
   * @returns {HTMLElement}
   */
  _el(tag, opts) {
    const el = document.createElement(tag);
    if (opts.text !== undefined) el.textContent = opts.text;
    if (opts.styles) Object.assign(el.style, opts.styles);
    return el;
  },

  /**
   * Apply an image size change from the inline canvas overlay.
   * Updates slide data, re-renders the canvas, and syncs the editor dropdown.
   */
  _applyImageSize(newSize) {
    const idx   = this.currentSlideIndex;
    const slide = window.presentationData && window.presentationData.slides[idx];
    if (!slide) return;

    slide.imageSize = newSize;

    // Re-render the slide canvas
    this.renderSlide(slide, window.presentationData.theme);

    // Sync editor dropdown
    const sel = document.getElementById('edit-image-size');
    if (sel) sel.value = newSize;

    // Persist into editor module so Save picks it up
    if (window.SlideEditor && typeof SlideEditor.loadSlide === 'function') {
      SlideEditor.loadSlide(slide);
    }
  },

  /**
   * Truncate a string to maxLen characters.
   * @param {string} str
   * @param {number} maxLen
   * @returns {string}
   */
  _truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
  }
};
