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
   * Math rendering helper (KaTeX)
   * Parses $$....$$ (display) and $...$ (inline) in bullet text.
   * Falls back to plain text if KaTeX is not loaded.
   * ---------------------------------------------------------- */

  /**
   * Render a string that may contain LaTeX math into an HTMLElement.
   * Uses KaTeX when available, otherwise falls back to textContent.
   * @param {string} text
   * @returns {DocumentFragment}
   */
  _renderMathText(text) {
    const frag = document.createDocumentFragment();
    if (!text) return frag;

    const katex = window.katex;
    if (!katex) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }

    // Clean up double-escaped backslashes, form feeds (\f -> \x0C), and other control characters
    let cleanText = text
      .replace(/\\\\/g, '\\')
      .replace(/\x0C/g, '\\f') // Restores form-feed () to \f (so it becomes \frac)
      .replace(/\x0B/g, '\\v')
      .replace(/\x07/g, '\\a')
      .replace(/\x08/g, '\\b')
      // Restore missing backslash for common LaTeX commands in case they were escaped or mangled
      .replace(/(^|[^A-Za-z\\])(rac|frac|sqrt|int|sum|lim|sin|cos|tan|theta|alpha|beta|gamma|delta|pi|phi|psi|omega|lambda|sigma|mu|nu|zeta|eta|iota|kappa|tau|upsilon|xi|chi|rho)\{/g, 
        (m, prefix, command) => `${prefix}\\${command === 'rac' ? 'frac' : command}{`
      );

    // Split on $$....$$ (display) and $..$ (inline), keeping the delimiters
    const parts = cleanText.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g);
    for (const part of parts) {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        const span = document.createElement('span');
        try {
          span.innerHTML = katex.renderToString(math, { displayMode: true, throwOnError: false });
        } catch {
          span.textContent = part;
        }
        frag.appendChild(span);
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const math = part.slice(1, -1);
        const span = document.createElement('span');
        try {
          span.innerHTML = katex.renderToString(math, { displayMode: false, throwOnError: false });
        } catch {
          span.textContent = part;
        }
        frag.appendChild(span);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }
    return frag;
  },

  /* ----------------------------------------------------------
   * Main slide rendering
   * ---------------------------------------------------------- */

  /**
   * Render a single slide into the #slide-canvas element.
   *
   * @param {Object} slideData — Slide data object
   * @param {string} themeKey  — Theme key from window.THEMES
   * @param {string} [design]  — Design style key (executive/boardroom/immersive)
   */
  renderSlide(slideData, themeKey, design) {
    const designKey = design || (window.presentationData && window.presentationData.design) || 'executive';
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

    // Set dynamic base font-size to make slide elements scale proportionally (responsive)
    const width = canvas.offsetWidth || 800;
    canvas.style.fontSize = `${Math.max(8, (width / 800) * 16)}px`;


    // Dispatch to the correct layout renderer
    switch (slideData.type) {
      case 'title':
        if (designKey === 'boardroom') this._renderBoardroomTitleSlide(canvas, slideData, theme);
        else if (designKey === 'immersive') this._renderImmersiveTitleSlide(canvas, slideData, theme);
        else if (designKey === 'simple') this._renderSimpleTitleSlide(canvas, slideData, theme);
        else this._renderTitleSlide(canvas, slideData, theme);
        break;
      case 'summary':
        if (designKey === 'boardroom') this._renderBoardroomSummarySlide(canvas, slideData, theme);
        else if (designKey === 'immersive') this._renderImmersiveSummarySlide(canvas, slideData, theme);
        else if (designKey === 'simple') this._renderSimpleSummarySlide(canvas, slideData, theme);
        else this._renderSummarySlide(canvas, slideData, theme);
        break;
      case 'content':
      default:
        if (designKey === 'boardroom') this._renderBoardroomContentSlide(canvas, slideData, theme);
        else if (designKey === 'immersive') this._renderImmersiveContentSlide(canvas, slideData, theme);
        else if (designKey === 'simple') this._renderSimpleContentSlide(canvas, slideData, theme);
        else this._renderContentSlide(canvas, slideData, theme);
        break;
    }
  },

  // Content slides always read text-left / image-right.
  // Kept identical to PPTExport._chooseComposition so the preview matches the
  // exported .pptx exactly — see the comment there for why this is fixed.
  // Returns: 'text-left-image-right' | 'image-left-text-right' | 'image-top-text-bottom'
  _chooseComposition(sk, hasImg, bulletCount, totalChars) {
    return 'text-left-image-right';
  },

  /* --- Title Slide ----------------------------------------- */

  // Title slide image size configs [width%, right%, top%, height%]
  _TITLE_IMG_SIZES: {
    small:  { width: '22%', right: '3%', top: '22%', height: '55%' },
    medium: { width: '29%', right: '4%', top: '16%', height: '68%' },
    large:  { width: '38%', right: '2%', top: '10%', height: '80%' },
    none:   null,
    full:   null
  },

  _renderTitleSlide(canvas, slide, theme) {
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const sizeKey = slide.imageSize || 'medium';
    const titleLayout = (imgSrc && sizeKey !== 'none') ? (this._TITLE_IMG_SIZES[sizeKey] || this._TITLE_IMG_SIZES.medium) : null;
    const hasImg = !!(imgSrc && titleLayout);
    const textW = hasImg ? (sizeKey === 'large' ? '44%' : sizeKey === 'small' ? '68%' : '54%') : '86%';

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

    // Image block on the right (size-aware)
    const layout = titleLayout || this._TITLE_IMG_SIZES.medium;
    const showTitleImg = !!(sizeKey !== 'none' && layout);
    if (showTitleImg) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          right: layout.right, top: layout.top,
          width: layout.width, height: layout.height,
          borderRadius: '10px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: '2',
          background: fit === 'contain' ? '#ffffff' : 'transparent',
          cursor: 'pointer'
        }
      });
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);

      // ── Inline edit overlay (Smaller / Replace / Larger) ────
      const overlay = document.createElement('div');
      overlay.className = 'img-edit-overlay';
      overlay.innerHTML = `
        <div class="img-edit-toolbar">
          <button class="img-edit-btn" data-action="smaller" title="Make smaller">◀ Smaller</button>
          <button class="img-edit-btn img-edit-btn--replace" data-action="replace" title="Replace image">🔍 Replace</button>
          <button class="img-edit-btn" data-action="larger" title="Make larger">Larger ▶</button>
        </div>`;
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

      const sizeDown = { large: 'medium', medium: 'small', small: 'none', none: 'none' };
      const sizeUp   = { none: 'small', small: 'medium', medium: 'large', large: 'large' };

      overlay.querySelector('[data-action="smaller"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const cur  = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
        const next = sizeDown[cur] || 'none';
        this._applyImageSize(next);
      });
      overlay.querySelector('[data-action="larger"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const cur  = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
        const next = sizeUp[cur] || 'large';
        this._applyImageSize(next);
      });
      overlay.querySelector('[data-action="replace"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const searchInput = document.getElementById('edit-image-search');
        if (searchInput) {
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => searchInput.focus(), 300);
        }
      });

      imgWrap.appendChild(overlay);
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

    // Composition-aware layout
    const bullets = slide.bullets || [];
    const bulletCount = bullets.length;
    const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
    const hasImg = !!(imgSrc && sizeKey !== 'none' && sizeKey !== 'full' && layout.width);
    const composition = this._chooseComposition(sizeKey, hasImg, bulletCount, totalChars);

    let textLeft = '5%';
    let textW = layout.textW;
    let textTop = '22%';
    let textBottom = '3%';
    let imgStyleProps = null;

    if (composition === 'image-left-text-right') {
      imgStyleProps = {
        left: '5%',
        top: layout.top,
        width: layout.width,
        maxHeight: '78%'
      };
      textLeft = `calc(5% + ${layout.width} + 4%)`;
      textW = `calc(85% - ${layout.width} - 4%)`;
    } else if (composition === 'image-top-text-bottom') {
      imgStyleProps = {
        left: '5%',
        top: '22%',
        width: '85%',
        maxHeight: '35%'
      };
      textLeft = '5%';
      textW = '85%';
      textTop = '59%';
    } else if (hasImg) {
      imgStyleProps = {
        right: layout.right,
        top: layout.top,
        width: layout.width,
        maxWidth: `calc(100% - ${layout.right} - 2%)`,
        maxHeight: '78%'
      };
    }

    if (bullets.length > 0) {
      const bulletFontSize = totalChars > 700 ? '0.72em' : totalChars > 450 ? '0.80em' : '0.88em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.45em' : '0.6em';

      const list = this._el('div', {
        styles: {
          position: 'absolute',
          left: textLeft, top: textTop, bottom: textBottom,
          width: textW,
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
        const textSpan = document.createElement('span');
        textSpan.appendChild(this._renderMathText(text || ''));
        row.appendChild(textSpan);
        list.appendChild(row);
      });

      canvas.appendChild(list);
    }

    // Image (if present and not full-bleed)
    if (hasImg && imgStyleProps) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          ...imgStyleProps,
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
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }
  },

  /* --- Summary Slide --------------------------------------- */

  // Summary slide image size configs
  _SUMMARY_IMG_SIZES: {
    small:  { width: '16%', right: '3%', top: '12%', maxHeight: '28%' },
    medium: { width: '24%', right: '3%', top: '12%', maxHeight: '35%' },
    large:  { width: '33%', right: '2%', top: '10%', maxHeight: '44%' },
    none:   null,
    full:   null
  },

  _renderSummarySlide(canvas, slide, theme) {
    // Image in top-right corner — size respects slide.imageSize
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const sizeKey = slide.imageSize || 'medium';
    const summaryLayout = sizeKey !== 'none' ? (this._SUMMARY_IMG_SIZES[sizeKey] || this._SUMMARY_IMG_SIZES.medium) : null;

    if (summaryLayout) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          right: summaryLayout.right, top: summaryLayout.top,
          width: summaryLayout.width, maxHeight: summaryLayout.maxHeight,
          aspectRatio: '4/3',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          zIndex: '2',
          cursor: 'pointer',
          background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || '';
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = () => { imgWrap.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      imgWrap.appendChild(img);

      // Inline edit overlay
      const overlay = document.createElement('div');
      overlay.className = 'img-edit-overlay';
      overlay.innerHTML = `<div class="img-edit-toolbar">
        <button class="img-edit-btn" data-action="smaller" title="Smaller">◀ Smaller</button>
        <button class="img-edit-btn img-edit-btn--replace" data-action="replace" title="Replace">🔍 Replace</button>
        <button class="img-edit-btn" data-action="larger" title="Larger">Larger ▶</button>
      </div>`;
      imgWrap.addEventListener('mouseenter', () => { overlay.style.opacity='1'; overlay.style.background='rgba(0,0,0,0.48)'; overlay.style.pointerEvents='auto'; });
      imgWrap.addEventListener('mouseleave', () => { overlay.style.opacity='0'; overlay.style.background='rgba(0,0,0,0)'; overlay.style.pointerEvents='none'; });
      const sizeDown = { large:'medium', medium:'small', small:'none', none:'none' };
      const sizeUp   = { none:'small', small:'medium', medium:'large', large:'large' };
      overlay.querySelector('[data-action="smaller"]').addEventListener('click', e => {
        e.stopPropagation();
        const cur = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
        this._applyImageSize(sizeDown[cur] || 'none');
      });
      overlay.querySelector('[data-action="larger"]').addEventListener('click',  e => {
        e.stopPropagation();
        const cur = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
        this._applyImageSize(sizeUp[cur] || 'large');
      });
      overlay.querySelector('[data-action="replace"]').addEventListener('click', e => {
        e.stopPropagation();
        const s = document.getElementById('edit-image-search');
        if (s) { s.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => s.focus(), 300); }
      });
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

    // Thin accent underline (sits directly below the title, before the bullet list)
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '6%', top: '20%', width: '6%', height: '3px', background: '#' + theme.accent, borderRadius: '2px' }
    }));

    // Bullet points centered
    const bullets = slide.bullets || [];
    if (bullets.length > 0) {
      const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
      const bulletFontSize = totalChars > 700 ? '0.74em' : totalChars > 450 ? '0.83em' : '0.92em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.48em' : '0.6em';

      // Shrink text area when image is shown, scale based on image size
      const hasImg = !!(imgSrc && summaryLayout);
      const imgRight = hasImg
        ? (sizeKey === 'large' ? '38%' : sizeKey === 'small' ? '22%' : '30%')
        : '8%';
      const list = this._el('div', {
        styles: {
          position: 'absolute',
          left: '8%',
          right: imgRight,
          top: '23%', bottom: '14%',
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

        const txt = document.createElement('span');
        txt.appendChild(this._renderMathText(text || ''));
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

  /* --- Helper: Attach Inline Image Edit Overlay ----------------- */
  _attachImgOverlay(imgWrap) {
    const overlay = document.createElement('div');
    overlay.className = 'img-edit-overlay';
    overlay.innerHTML = `
      <div class="img-edit-toolbar">
        <button class="img-edit-btn" data-action="smaller" title="Make smaller">◀ Smaller</button>
        <button class="img-edit-btn img-edit-btn--replace" data-action="replace" title="Replace image">🔍 Replace</button>
        <button class="img-edit-btn" data-action="larger" title="Make larger">Larger ▶</button>
      </div>`;
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
    const sizeDown = { full: 'large', large: 'medium', medium: 'small', small: 'none', none: 'none' };
    const sizeUp   = { none: 'small', small: 'medium', medium: 'large', large: 'full', full: 'full' };
    overlay.querySelector('[data-action="smaller"]').addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
      this._applyImageSize(sizeDown[cur] || 'none');
    });
    overlay.querySelector('[data-action="larger"]').addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = (window.presentationData.slides[SlidePreview.currentSlideIndex].imageSize) || 'medium';
      this._applyImageSize(sizeUp[cur] || 'large');
    });
    overlay.querySelector('[data-action="replace"]').addEventListener('click', (e) => {
      e.stopPropagation();
      const searchInput = document.getElementById('edit-image-search');
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => searchInput.focus(), 300);
      }
    });
    imgWrap.appendChild(overlay);
  },

  /* --- Boardroom Design Renderers ------------------------------- */

  _renderBoardroomTitleSlide(canvas, slide, theme) {
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const sizeKey = slide.imageSize || 'medium';
    const showTitleImg = !!(imgSrc && sizeKey !== 'none');

    // Left gradient panel: 56% width
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '0', top: '0', bottom: '0', width: '56%',
        background: `linear-gradient(160deg, #${theme.bgGradient[0]}, #${theme.bgGradient[1]})`,
        zIndex: '1'
      }
    }));

    // Right accent panel: 44% width
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', right: '0', top: '0', bottom: '0', width: '44%',
        background: '#' + theme.accent,
        zIndex: '1'
      }
    }));

    // Diagonal triangle divider at seam (x=53%)
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '53%', top: '0', width: '10%', height: '100%',
        clipPath: 'polygon(0 0, 100% 0, 0 100%)',
        background: '#' + theme.bgGradient[1],
        zIndex: '1'
      }
    }));

    // Left panel depth decorative circle (bottom-left)
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-12%', bottom: '-20%', width: '38em', height: '38em',
        borderRadius: '50%', background: '#' + theme.accent, opacity: '0.09',
        pointerEvents: 'none', zIndex: '1'
      }
    }));

    // Pre-title accent rule
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '5.5%', top: '29%', width: '28%', height: '4px',
        background: '#' + theme.accent, borderRadius: '2px', zIndex: '2'
      }
    }));

    // Title
    canvas.appendChild(this._el('div', {
      text: slide.title || '',
      styles: {
        position: 'absolute', left: '5.5%', top: '32%', width: '45.5%',
        fontSize: '2.1em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#' + theme.textColor, lineHeight: '1.18', zIndex: '2'
      }
    }));

    // Subtitle
    if (slide.subtitle) {
      canvas.appendChild(this._el('div', {
        text: slide.subtitle,
        styles: {
          position: 'absolute', left: '5.5%', top: '71%', width: '45.5%',
          fontSize: '1.1em', color: '#' + theme.subtextColor, lineHeight: '1.4', zIndex: '2'
        }
      }));
    }

    // Bottom strip under left panel
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '0', bottom: '0', width: '53%', height: '5.3%',
        background: '#' + theme.accent, opacity: '0.28', zIndex: '2'
      }
    }));

    // Right panel: Image OR Large faded initial letter fallback
    if (showTitleImg) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute', right: '2.5%', top: '3.5%', width: '37.5%', height: '93%',
          borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          zIndex: '2', background: fit === 'contain' ? '#ffffff' : 'transparent', cursor: 'pointer'
        }
      });
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      const imgOverlay = this._el('div', {
        styles: { position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }
      });
      imgWrap.appendChild(imgOverlay);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    } else {
      const firstChar = (slide.title || '?').trim().charAt(0).toUpperCase();
      canvas.appendChild(this._el('div', {
        text: firstChar,
        styles: {
          position: 'absolute', right: '2.5%', top: '3.5%', width: '37.5%', height: '93%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8em', fontWeight: '700', fontFamily: theme.fontHead,
          color: '#ffffff', opacity: '0.78', zIndex: '2', userSelect: 'none'
        }
      }));
    }
  },

  _renderBoardroomContentSlide(canvas, slide, theme) {
    const sizeKey = slide.imageSize || 'medium';
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const hasImg = !!(imgSrc && sizeKey !== 'none');

    // 1. Full-background mode if sk === 'full'
    if (sizeKey === 'full') {
      const bgImg = this._el('div', {
        styles: { position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '0' }
      });
      const img = document.createElement('img');
      const fit = slide.imageFit || 'cover';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      bgImg.appendChild(img);
      this._setupSlideImage(slide, bgImg, img, imgSrc);
      canvas.appendChild(bgImg);
      const bgOverlay = this._el('div', {
        styles: { position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.58)', zIndex: '0' }
      });
      canvas.appendChild(bgOverlay);
    } else {
      canvas.style.background = `linear-gradient(160deg, #${theme.bgGradient[0]}, #${theme.bgGradient[1]})`;
      canvas.appendChild(this._el('div', {
        styles: {
          position: 'absolute', right: '-15%', top: '-20%', width: '35em', height: '35em',
          borderRadius: '50%', background: '#' + theme.accent, opacity: '0.08', pointerEvents: 'none', zIndex: '1'
        }
      }));
    }

    // 2. Angled left panel strip
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '0', top: '0', bottom: '0', width: '6%', background: '#' + theme.bgGradient[1], zIndex: '2' }
    }));
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '6%', top: '0', width: '5%', height: '100%',
        clipPath: 'polygon(0 0, 100% 0, 0 100%)', background: '#' + theme.bgGradient[1], zIndex: '2'
      }
    }));
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '0', top: '0', bottom: '0', width: '1.8%', background: '#' + theme.accent, zIndex: '3' }
    }));

    // 3. Title gradient band
    const titleBand = this._el('div', {
      styles: {
        position: 'absolute', left: '12%', top: '0', width: '88%', height: '17.2%',
        background: `linear-gradient(90deg, #${theme.bgGradient[1]}, #${theme.bgGradient[0]})`,
        display: 'flex', alignItems: 'center', zIndex: '2'
      }
    });
    const titleText = this._el('div', {
      text: slide.title || '',
      styles: {
        marginLeft: '2%', fontSize: '1.45em', fontWeight: '700',
        fontFamily: theme.fontHead, color: '#' + theme.textColor
      }
    });
    titleBand.appendChild(titleText);
    canvas.appendChild(titleBand);

    // 4. Diagonal stripe rule below title band
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-10%', top: '17.2%', width: '120%', height: '3px',
        background: '#' + theme.accent, opacity: '0.68', transform: 'rotate(-1.5deg)', zIndex: '3'
      }
    }));

    // Default right-side image layout
    const layout = this._IMG_SIZES[sizeKey] || this._IMG_SIZES.medium;
    const bullets = slide.bullets || [];
    const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);

    let textLeft = '13.5%';
    let textW = (hasImg && sizeKey !== 'full')
      ? (sizeKey === 'large' ? '36%' : sizeKey === 'small' ? '62%' : '48%')
      : '82%';
    let textTop = '22%';
    let textBottom = '3%';
    let imgStyleProps = (hasImg && sizeKey !== 'full') ? {
      right: layout.right,
      top: layout.top,
      width: layout.width,
      maxWidth: `calc(100% - ${layout.right} - 2%)`,
      maxHeight: '78%'
    } : null;

    if (bullets.length > 0) {
      const bulletFontSize = totalChars > 700 ? '0.72em' : totalChars > 450 ? '0.80em' : '0.88em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.45em' : '0.6em';

      const list = this._el('div', {
        styles: {
          position: 'absolute', left: textLeft, top: textTop, bottom: textBottom, width: textW,
          display: 'flex', flexDirection: 'column', gap: bulletGap, zIndex: '3', overflow: 'hidden'
        }
      });

      bullets.forEach(text => {
        const row = this._el('div', {
          styles: { display: 'flex', alignItems: 'flex-start', gap: '0.5em', fontSize: bulletFontSize, lineHeight: '1.4', color: '#' + theme.textColor }
        });
        const dot = this._el('span', {
          text: '●',
          styles: { color: '#' + theme.accent, fontSize: '0.6em', marginTop: '0.45em', flexShrink: '0' }
        });
        row.appendChild(dot);
        const textSpan = document.createElement('span');
        textSpan.appendChild(this._renderMathText(text || ''));
        row.appendChild(textSpan);
        list.appendChild(row);
      });
      canvas.appendChild(list);
    }

    if (hasImg && sizeKey !== 'full' && imgStyleProps) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          ...imgStyleProps,
          aspectRatio: fit === 'contain' ? '16/11' : '4/3',
          borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          cursor: 'pointer', zIndex: '3', background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }
  },

  _renderBoardroomSummarySlide(canvas, slide, theme) {
    const sizeKey = slide.imageSize || 'medium';
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const summaryLayout = sizeKey !== 'none' ? (this._SUMMARY_IMG_SIZES[sizeKey] || this._SUMMARY_IMG_SIZES.medium) : null;
    const hasImg = !!(imgSrc && summaryLayout);

    // 1. Background + two decorative ovals
    canvas.style.background = `linear-gradient(160deg, #${theme.bgGradient[0]}, #${theme.bgGradient[1]})`;
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', right: '-12%', bottom: '-15%', width: '35em', height: '35em',
        borderRadius: '50%', background: '#' + theme.accent, opacity: '0.09', pointerEvents: 'none', zIndex: '1'
      }
    }));
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-7%', top: '-12%', width: '22em', height: '22em',
        borderRadius: '50%', background: '#' + theme.accent, opacity: '0.07', pointerEvents: 'none', zIndex: '1'
      }
    }));

    // 2. Angled left panel
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '0', top: '0', bottom: '0', width: '6%', background: '#' + theme.bgGradient[1], zIndex: '2' }
    }));
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '6%', top: '0', width: '5%', height: '100%',
        clipPath: 'polygon(0 0, 100% 0, 0 100%)', background: '#' + theme.bgGradient[1], zIndex: '2'
      }
    }));
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '0', top: '0', bottom: '0', width: '1.8%', background: '#' + theme.accent, zIndex: '3' }
    }));

    // 3. Taller gradient title band with CENTER-ALIGNED title
    const titleBand = this._el('div', {
      styles: {
        position: 'absolute', left: '12%', top: '0', width: '88%', height: '23.5%',
        background: `linear-gradient(90deg, #${theme.bgGradient[1]}, #${theme.bgGradient[0]})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '2'
      }
    });
    const titleText = this._el('div', {
      text: slide.title || 'Key Takeaways',
      styles: {
        fontSize: '1.9em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#' + theme.textColor, textAlign: 'center'
      }
    });
    titleBand.appendChild(titleText);
    canvas.appendChild(titleBand);

    // 4. Diagonal stripe rule below title band
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-10%', top: '23.5%', width: '120%', height: '3px',
        background: '#' + theme.accent, opacity: '0.68', transform: 'rotate(-1.5deg)', zIndex: '3'
      }
    }));

    // 5. Bullets + Image layout
    const bullets = slide.bullets || [];
    if (bullets.length > 0) {
      const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
      const bulletFontSize = totalChars > 700 ? '0.74em' : totalChars > 450 ? '0.83em' : '0.92em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.48em' : '0.6em';

      const imgRight = hasImg
        ? (sizeKey === 'large' ? '38%' : sizeKey === 'small' ? '22%' : '30%')
        : '8%';

      const list = this._el('div', {
        styles: {
          position: 'absolute', left: '13.5%', right: imgRight, top: '28%', bottom: '15%',
          display: 'flex', flexDirection: 'column', gap: bulletGap, overflow: 'hidden', zIndex: '3'
        }
      });

      bullets.forEach(text => {
        const row = this._el('div', {
          styles: { display: 'flex', alignItems: 'flex-start', gap: '0.55em', fontSize: bulletFontSize, lineHeight: '1.4', color: '#' + theme.textColor }
        });
        const dot = this._el('span', {
          text: '✦',
          styles: { color: '#' + theme.accent, fontSize: '0.7em', marginTop: '0.35em', flexShrink: '0' }
        });
        const txt = document.createElement('span');
        txt.appendChild(this._renderMathText(text || ''));
        row.appendChild(dot);
        row.appendChild(txt);
        list.appendChild(row);
      });
      canvas.appendChild(list);
    }

    if (hasImg && summaryLayout) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute', right: summaryLayout.right, top: '28%', width: summaryLayout.width, maxHeight: '35%',
          aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          zIndex: '3', cursor: 'pointer', background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || '';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = () => { imgWrap.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }

    // 6. Rounded pill "Thank You!" footer
    const thanksPill = this._el('div', {
      styles: {
        position: 'absolute', left: '35%', width: '32%', bottom: '5%', height: '7.5%',
        background: '#' + theme.accent, opacity: '0.9', borderRadius: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '3'
      }
    });
    const thanksText = this._el('div', {
      text: 'Thank You!',
      styles: { fontSize: '1.2em', fontWeight: '700', fontFamily: theme.fontHead, color: '#ffffff' }
    });
    thanksPill.appendChild(thanksText);
    canvas.appendChild(thanksPill);
  },

  /* --- Immersive Design Renderers ------------------------------- */

  _renderImmersiveTitleSlide(canvas, slide, theme) {
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const sizeKey = slide.imageSize || 'medium';
    const showTitleImg = !!(imgSrc && sizeKey !== 'none');

    // 1. Full-bleed background image OR gradient + large decorative oval
    if (showTitleImg) {
      const bgImg = this._el('div', {
        styles: { position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '0' }
      });
      const img = document.createElement('img');
      const fit = slide.imageFit || 'cover';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      bgImg.appendChild(img);
      this._setupSlideImage(slide, bgImg, img, imgSrc);
      canvas.appendChild(bgImg);
    } else {
      canvas.style.background = `linear-gradient(125deg, #${theme.bgGradient[0]}, #${theme.bgGradient[1]})`;
      canvas.appendChild(this._el('div', {
        styles: {
          position: 'absolute', right: '-5%', top: '5%', width: '38em', height: '38em',
          borderRadius: '50%', background: '#' + theme.accent, opacity: '0.14',
          pointerEvents: 'none', zIndex: '0'
        }
      }));
    }

    // 2. Dark overlay for legibility
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.38)', zIndex: '1' }
    }));

    // 3. Large corner triangle top-right
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', right: '0', top: '0', width: '48%', height: '68%',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%)', background: '#' + theme.accent,
        opacity: '0.40', zIndex: '1'
      }
    }));

    // 4. Bottom accent band
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '0', bottom: '0', width: '100%', height: '14.3%',
        background: '#' + theme.accent, zIndex: '2'
      }
    }));

    // 5. Diagonal stripe graphic divider above bottom accent band
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-10%', bottom: '14.3%', width: '120%', height: '3px',
        background: '#' + theme.accent, opacity: '0.9', transform: 'rotate(-2deg)', zIndex: '3'
      }
    }));

    // 6. Left vertical accent stripe along left edge
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '0', top: '0', bottom: '0', width: '3.5%', background: '#' + theme.accent, zIndex: '2' }
    }));

    // 7. Title lower-left area
    canvas.appendChild(this._el('div', {
      text: slide.title || '',
      styles: {
        position: 'absolute', left: '5.5%', bottom: '20%', width: '91%',
        fontSize: '2.5em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#ffffff', textShadow: '0 3px 10px rgba(0,0,0,0.7)', lineHeight: '1.15', zIndex: '3'
      }
    }));

    // 8. Subtitle inside bottom accent band
    if (slide.subtitle) {
      canvas.appendChild(this._el('div', {
        text: slide.subtitle,
        styles: {
          position: 'absolute', left: '5.5%', bottom: '3%', width: '91%',
          fontSize: '1.1em', color: '#ffffff', fontFamily: theme.fontBody, zIndex: '3'
        }
      }));
    }
  },

  _renderImmersiveContentSlide(canvas, slide, theme) {
    const sizeKey = slide.imageSize || 'medium';
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const hasImg = !!(imgSrc && sizeKey !== 'none');

    // 1. Full-background mode if sk === 'full'
    if (sizeKey === 'full') {
      const bgImg = this._el('div', {
        styles: { position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '0' }
      });
      const img = document.createElement('img');
      const fit = slide.imageFit || 'cover';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      bgImg.appendChild(img);
      this._setupSlideImage(slide, bgImg, img, imgSrc);
      canvas.appendChild(bgImg);

      const bgOverlay = this._el('div', {
        styles: { position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.40)', zIndex: '0' }
      });
      canvas.appendChild(bgOverlay);
    } else {
      canvas.style.background = `linear-gradient(125deg, #${theme.bgGradient[0]}, #${theme.bgGradient[1]})`;

      // Top-right corner triangle
      canvas.appendChild(this._el('div', {
        styles: {
          position: 'absolute', right: '0', top: '0', width: '38%', height: '57%',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%)', background: '#' + theme.accent, opacity: '0.50', zIndex: '1'
        }
      }));

      // Bottom-left corner triangle
      canvas.appendChild(this._el('div', {
        styles: {
          position: 'absolute', left: '0', bottom: '0', width: '28%', height: '29%',
          clipPath: 'polygon(0 100%, 0 0, 100% 100%)', background: '#' + theme.accent, opacity: '0.58', zIndex: '1'
        }
      }));
    }

    // 2. Header gradient band across top
    const headerBand = this._el('div', {
      styles: {
        position: 'absolute', left: '0', top: '0', width: '100%', height: '17%',
        background: `linear-gradient(90deg, #${theme.bgGradient[1]}, #${theme.bgGradient[0]})`,
        display: 'flex', alignItems: 'center', zIndex: '2'
      }
    });

    // Left accent strip on header
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '0', top: '0', width: '1.6%', height: '17%', background: '#' + theme.accent, zIndex: '3' }
    }));

    const titleText = this._el('div', {
      text: slide.title || '',
      styles: {
        marginLeft: '3%', fontSize: '1.5em', fontWeight: '700',
        fontFamily: theme.fontHead, color: '#' + theme.textColor
      }
    });
    headerBand.appendChild(titleText);
    canvas.appendChild(headerBand);

    // 3. Diagonal stripe rule below header
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-10%', top: '17%', width: '120%', height: '3px',
        background: '#' + theme.accent, opacity: '0.78', transform: 'rotate(-2deg)', zIndex: '3'
      }
    }));

    // 4. Right accent vertical rule along right edge
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', right: '0', top: '0', bottom: '0', width: '1.6%', background: '#' + theme.accent, opacity: '0.55', zIndex: '2' }
    }));

    // 5. Composition-aware NUMBERED bullets + Image layout (Immersive signature)
    const layout = this._IMG_SIZES[sizeKey] || this._IMG_SIZES.medium;
    const bullets = slide.bullets || [];
    const bulletCount = bullets.length;
    const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
    const composition = this._chooseComposition(sizeKey, hasImg, bulletCount, totalChars);

    let textLeft = '4%';
    let textW = (hasImg && sizeKey !== 'full')
      ? (sizeKey === 'large' ? '40%' : sizeKey === 'small' ? '66%' : '52%')
      : '90%';
    let textTop = '22%';
    let textBottom = '3%';
    let imgStyleProps = null;

    if (composition === 'image-left-text-right') {
      imgStyleProps = {
        left: '4%',
        top: layout.top,
        width: layout.width,
        maxHeight: '78%'
      };
      textLeft = `calc(4% + ${layout.width} + 4%)`;
      textW = `calc(90% - ${layout.width} - 4%)`;
    } else if (composition === 'image-top-text-bottom') {
      imgStyleProps = {
        left: '4%',
        top: '22%',
        width: '90%',
        maxHeight: '35%'
      };
      textLeft = '4%';
      textW = '90%';
      textTop = '59%';
    } else if (hasImg && sizeKey !== 'full') {
      imgStyleProps = {
        right: layout.right,
        top: layout.top,
        width: layout.width,
        maxWidth: `calc(100% - ${layout.right} - 2%)`,
        maxHeight: '78%'
      };
    }

    if (bullets.length > 0) {
      const bulletFontSize = totalChars > 700 ? '0.72em' : totalChars > 450 ? '0.80em' : '0.88em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.45em' : '0.6em';

      const list = this._el('div', {
        styles: {
          position: 'absolute', left: textLeft, top: textTop, bottom: textBottom, width: textW,
          display: 'flex', flexDirection: 'column', gap: bulletGap, zIndex: '3', overflow: 'hidden'
        }
      });

      bullets.forEach((text, i) => {
        const row = this._el('div', {
          styles: { display: 'flex', alignItems: 'flex-start', gap: '0.6em', fontSize: bulletFontSize, lineHeight: '1.4', color: '#' + theme.textColor }
        });

        // Numbered circular badge (Immersive signature)
        const badge = this._el('span', {
          text: String(i + 1),
          styles: {
            width: '1.4em', height: '1.4em', borderRadius: '50%',
            background: '#' + theme.accent, color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75em', fontWeight: '700', flexShrink: '0', marginTop: '0.15em'
          }
        });
        row.appendChild(badge);

        const textSpan = document.createElement('span');
        textSpan.appendChild(this._renderMathText(text || ''));
        row.appendChild(textSpan);
        list.appendChild(row);
      });
      canvas.appendChild(list);
    }

    // Image (if present, not full-bleed)
    if (hasImg && sizeKey !== 'full' && imgStyleProps) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          ...imgStyleProps,
          aspectRatio: fit === 'contain' ? '16/11' : '4/3',
          borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          cursor: 'pointer', zIndex: '3', background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }
  },

  _renderImmersiveSummarySlide(canvas, slide, theme) {
    const sizeKey = slide.imageSize || 'medium';
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const summaryLayout = sizeKey !== 'none' ? (this._SUMMARY_IMG_SIZES[sizeKey] || this._SUMMARY_IMG_SIZES.medium) : null;
    const hasImg = !!(imgSrc && summaryLayout);

    // 1. Background + two depth ovals
    canvas.style.background = `linear-gradient(125deg, #${theme.bgGradient[0]}, #${theme.bgGradient[1]})`;
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', right: '-12%', top: '15%', width: '35em', height: '35em',
        borderRadius: '50%', background: '#' + theme.accent, opacity: '0.10', pointerEvents: 'none', zIndex: '1'
      }
    }));
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-5%', top: '-5%', width: '22em', height: '22em',
        borderRadius: '50%', background: '#' + theme.accent, opacity: '0.07', pointerEvents: 'none', zIndex: '1'
      }
    }));

    // 2. Decorative corner triangles
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', right: '0', top: '0', width: '32%', height: '57%',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%)', background: '#' + theme.accent, opacity: '0.45', zIndex: '1'
      }
    }));
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '0', bottom: '0', width: '32%', height: '35.5%',
        clipPath: 'polygon(0 100%, 0 0, 100% 100%)', background: '#' + theme.accent, opacity: '0.50', zIndex: '1'
      }
    }));

    // 3. Full-width accent header (center-aligned white title)
    const header = this._el('div', {
      styles: {
        position: 'absolute', left: '0', top: '0', width: '100%', height: '27.5%',
        background: '#' + theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '2'
      }
    });
    const titleText = this._el('div', {
      text: slide.title || 'Key Takeaways',
      styles: { fontSize: '2.1em', fontWeight: '700', fontFamily: theme.fontHead, color: '#ffffff', textAlign: 'center' }
    });
    header.appendChild(titleText);
    canvas.appendChild(header);

    // 4. Diagonal stripe rule below header
    canvas.appendChild(this._el('div', {
      styles: {
        position: 'absolute', left: '-10%', top: '27.5%', width: '120%', height: '3px',
        background: '#' + theme.accent, opacity: '0.82', transform: 'rotate(-2deg)', zIndex: '3'
      }
    }));

    // 5. Small corner accent rules
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '5%', top: '30.5%', width: '14%', height: '3px', background: '#' + theme.accent, opacity: '0.55', zIndex: '3' }
    }));
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', right: '5%', top: '30.5%', width: '14%', height: '3px', background: '#' + theme.accent, opacity: '0.55', zIndex: '3' }
    }));

    // 6. Numbered bullets below header
    const bullets = slide.bullets || [];
    if (bullets.length > 0) {
      const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
      const bulletFontSize = totalChars > 700 ? '0.74em' : totalChars > 450 ? '0.83em' : '0.92em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.48em' : '0.6em';

      const imgRight = hasImg
        ? (sizeKey === 'large' ? '38%' : sizeKey === 'small' ? '22%' : '30%')
        : '8%';

      const list = this._el('div', {
        styles: {
          position: 'absolute', left: '10%', right: imgRight, top: '34%', bottom: '15%',
          display: 'flex', flexDirection: 'column', gap: bulletGap, overflow: 'hidden', zIndex: '3'
        }
      });

      bullets.forEach((text, i) => {
        const row = this._el('div', {
          styles: { display: 'flex', alignItems: 'flex-start', gap: '0.6em', fontSize: bulletFontSize, lineHeight: '1.4', color: '#' + theme.textColor }
        });

        // Numbered circular badge
        const badge = this._el('span', {
          text: String(i + 1),
          styles: {
            width: '1.4em', height: '1.4em', borderRadius: '50%',
            background: '#' + theme.accent, color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75em', fontWeight: '700', flexShrink: '0', marginTop: '0.15em'
          }
        });
        row.appendChild(badge);

        const txt = document.createElement('span');
        txt.appendChild(this._renderMathText(text || ''));
        row.appendChild(txt);
        list.appendChild(row);
      });
      canvas.appendChild(list);
    }

    if (hasImg && summaryLayout) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute', right: summaryLayout.right, top: '34%', width: summaryLayout.width, maxHeight: '35%',
          aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          zIndex: '3', cursor: 'pointer', background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || '';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = () => { imgWrap.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }

    // 7. Rounded pill "Thank You!" footer
    const thanksPill = this._el('div', {
      styles: {
        position: 'absolute', left: '35%', width: '30%', bottom: '5%', height: '8.5%',
        background: '#' + theme.accent, borderRadius: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '3'
      }
    });
    const thanksText = this._el('div', {
      text: 'Thank You!',
      styles: { fontSize: '1.3em', fontWeight: '700', fontFamily: theme.fontHead, color: '#ffffff' }
    });
    thanksPill.appendChild(thanksText);
    canvas.appendChild(thanksPill);
  },

  /* --- Simple Design Renderers ---------------------------------- */

  _renderSimpleTitleSlide(canvas, slide, theme) {
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const sizeKey = slide.imageSize || 'medium';
    const titleLayout = (imgSrc && sizeKey !== 'none') ? (this._TITLE_IMG_SIZES[sizeKey] || this._TITLE_IMG_SIZES.medium) : null;
    const hasImg = !!(imgSrc && titleLayout);
    const textW = hasImg ? (sizeKey === 'large' ? '44%' : sizeKey === 'small' ? '68%' : '54%') : '86%';

    // Title (left-aligned)
    canvas.appendChild(this._el('div', {
      text: slide.title || '',
      styles: {
        position: 'absolute', left: '7%', top: '32%', width: textW,
        fontSize: '2.3em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#' + theme.textColor, lineHeight: '1.15', zIndex: '2'
      }
    }));

    // Single thin accent rule under title
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '7%', top: '63%', width: '12%', height: '4px', background: '#' + theme.accent, borderRadius: '2px', zIndex: '2' }
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

    // Image block on the right (if present)
    const layout = titleLayout || this._TITLE_IMG_SIZES.medium;
    const showTitleImg = !!(sizeKey !== 'none' && layout);
    if (showTitleImg) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute',
          right: layout.right, top: layout.top,
          width: layout.width, height: layout.height,
          borderRadius: '10px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: '2',
          background: fit === 'contain' ? '#ffffff' : 'transparent',
          cursor: 'pointer'
        }
      });
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }
  },

  _renderSimpleContentSlide(canvas, slide, theme) {
    const sizeKey = slide.imageSize || 'medium';
    const layout  = this._IMG_SIZES[sizeKey] || this._IMG_SIZES.medium;

    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');

    // Full-background mode: image behind everything with semi-transparent white title chip
    if (sizeKey === 'full' && imgSrc) {
      const bgWrap = this._el('div', {
        styles: { position: 'absolute', inset: '0', overflow: 'hidden', zIndex: '0' }
      });
      const img = document.createElement('img');
      const fit = slide.imageFit || 'cover';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      bgWrap.appendChild(img);
      this._setupSlideImage(slide, bgWrap, img, imgSrc);
      canvas.appendChild(bgWrap);

      // Semi-transparent white title chip behind title text (NOT full dark overlay)
      const titleChip = this._el('div', {
        styles: {
          position: 'absolute', left: '3%', top: '4%', width: '94%', height: '17%',
          background: 'rgba(255, 255, 255, 0.85)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', padding: '0 2%',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: '2'
        }
      });
      const titleText = this._el('div', {
        text: slide.title || '',
        styles: {
          fontSize: '1.55em', fontWeight: '700', fontFamily: theme.fontHead,
          color: '#' + theme.textColor, lineHeight: '1.2'
        }
      });
      titleChip.appendChild(titleText);
      canvas.appendChild(titleChip);
      return;
    }

    // Title
    const title = this._el('div', {
      text: slide.title || '',
      styles: {
        position: 'absolute', left: '5%', top: '7%', width: layout.textW,
        fontSize: '1.55em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#' + theme.textColor, lineHeight: '1.2', zIndex: '2'
      }
    });
    canvas.appendChild(title);

    // Single thin accent rule beneath the title
    const underline = this._el('div', {
      styles: {
        position: 'absolute', left: '5%', top: '19%', width: '6%', height: '3px',
        background: '#' + theme.accent, borderRadius: '2px', zIndex: '2'
      }
    });
    canvas.appendChild(underline);

    // Default right-side image layout
    const bullets = slide.bullets || [];
    const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
    const hasImg = !!(imgSrc && sizeKey !== 'none' && sizeKey !== 'full' && layout.width);

    let textLeft = '5%';
    let textW = layout.textW;
    let textTop = '22%';
    let textBottom = '3%';
    let imgStyleProps = hasImg ? {
      right: layout.right, top: layout.top, width: layout.width,
      maxWidth: `calc(100% - ${layout.right} - 2%)`, maxHeight: '78%'
    } : null;

    if (bullets.length > 0) {
      const bulletFontSize = totalChars > 700 ? '0.72em' : totalChars > 450 ? '0.80em' : '0.88em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.45em' : '0.6em';

      const list = this._el('div', {
        styles: {
          position: 'absolute', left: textLeft, top: textTop, bottom: textBottom, width: textW,
          display: 'flex', flexDirection: 'column', gap: bulletGap, zIndex: '2', overflow: 'hidden'
        }
      });

      bullets.forEach(text => {
        const row = this._el('div', {
          styles: { display: 'flex', alignItems: 'flex-start', gap: '0.5em', fontSize: bulletFontSize, lineHeight: '1.4', color: '#' + theme.textColor }
        });
        const dot = this._el('span', {
          text: '●',
          styles: { color: '#' + theme.accent, fontSize: '0.6em', marginTop: '0.45em', flexShrink: '0' }
        });
        row.appendChild(dot);
        const textSpan = document.createElement('span');
        textSpan.appendChild(this._renderMathText(text || ''));
        row.appendChild(textSpan);
        list.appendChild(row);
      });

      canvas.appendChild(list);
    }

    if (hasImg && imgStyleProps) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute', ...imgStyleProps, aspectRatio: fit === 'contain' ? '16/11' : '4/3',
          borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          cursor: 'pointer', zIndex: '3', background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });

      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || 'Slide image';
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = function () { this.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }
  },

  _renderSimpleSummarySlide(canvas, slide, theme) {
    const imgSrc = slide.imageBase64 ||
      (slide.imageUrl ? window.PPT_CFG.proxyUrl(slide.imageUrl) : '');
    const sizeKey = slide.imageSize || 'medium';
    const summaryLayout = sizeKey !== 'none' ? (this._SUMMARY_IMG_SIZES[sizeKey] || this._SUMMARY_IMG_SIZES.medium) : null;
    const hasImg = !!(imgSrc && summaryLayout);

    if (summaryLayout) {
      const fit = slide.imageFit || 'cover';
      const imgWrap = this._el('div', {
        styles: {
          position: 'absolute', right: summaryLayout.right, top: summaryLayout.top,
          width: summaryLayout.width, maxHeight: summaryLayout.maxHeight, aspectRatio: '4/3',
          borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          zIndex: '2', cursor: 'pointer', background: fit === 'contain' ? '#ffffff' : 'transparent'
        }
      });
      const objPos = fit === 'contain' ? 'center center' : (slide.imagePosition || 'center center');
      const img = document.createElement('img');
      img.alt = slide.imageSearchTerm || '';
      img.style.cssText = `width:100%;height:100%;object-fit:${fit};object-position:${objPos};display:none;`;
      img.onerror = () => { imgWrap.style.display = 'none'; };
      imgWrap.appendChild(img);

      this._setupSlideImage(slide, imgWrap, img, imgSrc);
      this._attachImgOverlay(imgWrap);
      canvas.appendChild(imgWrap);
    }

    const title = this._el('div', {
      text: slide.title || 'Key Takeaways',
      styles: {
        position: 'absolute', left: '6%', top: '8%', width: imgSrc ? '60%' : '86%',
        fontSize: '1.9em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#' + theme.textColor, textAlign: 'left', lineHeight: '1.2'
      }
    });
    canvas.appendChild(title);

    // Thin accent rule under title
    canvas.appendChild(this._el('div', {
      styles: { position: 'absolute', left: '6%', top: '20%', width: '6%', height: '3px', background: '#' + theme.accent, borderRadius: '2px' }
    }));

    const bullets = slide.bullets || [];
    if (bullets.length > 0) {
      const totalChars = bullets.reduce((s, b) => s + (b || '').length, 0);
      const bulletFontSize = totalChars > 700 ? '0.74em' : totalChars > 450 ? '0.83em' : '0.92em';
      const bulletGap      = totalChars > 700 ? '0.35em' : totalChars > 450 ? '0.48em' : '0.6em';

      const imgRight = hasImg
        ? (sizeKey === 'large' ? '38%' : sizeKey === 'small' ? '22%' : '30%')
        : '8%';
      const list = this._el('div', {
        styles: {
          position: 'absolute', left: '8%', right: imgRight, top: '23%', bottom: '14%',
          display: 'flex', flexDirection: 'column', gap: bulletGap, overflow: 'hidden'
        }
      });

      bullets.forEach(text => {
        const row = this._el('div', {
          styles: { display: 'flex', alignItems: 'flex-start', gap: '0.55em', fontSize: bulletFontSize, lineHeight: '1.4', color: '#' + theme.textColor }
        });

        const dot = this._el('span', {
          text: '✦',
          styles: { color: '#' + theme.accent, fontSize: '0.7em', marginTop: '0.35em', flexShrink: '0' }
        });

        const txt = document.createElement('span');
        txt.appendChild(this._renderMathText(text || ''));
        row.appendChild(dot);
        row.appendChild(txt);
        list.appendChild(row);
      });

      canvas.appendChild(list);
    }

    const thanks = this._el('div', {
      text: 'Thank You!',
      styles: {
        position: 'absolute', left: '5%', right: '5%', bottom: '8%',
        fontSize: '1.5em', fontWeight: '700', fontFamily: theme.fontHead,
        color: '#' + theme.accent, textAlign: 'center'
      }
    });
    canvas.appendChild(thanks);
  },

  /**
   * Sets up the slide image source, falling back to a dynamic Wikipedia image query
   * if the image references are empty/missing (useful for legacy PPT views).
   */
  _setupSlideImage(slide, imgWrap, img, imgSrc) {
    if (imgSrc) {
      img.src = imgSrc;
      img.style.display = 'block';
    } else {
      // 1. Try to fetch the original embedded image from the saved .pptx file via our backend extractor
      if (window.presentationData && window.presentationData.materialId) {
        const slideIndex = window.presentationData.slides.indexOf(slide);
        if (slideIndex !== -1) {
          img.src = window.PPT_CFG.materialImageUrl(window.presentationData.materialId, slideIndex);
          img.style.display = 'block';
          return;
        }
      }

      // 2. Wikipedia search fallback
      const query = (slide.title || '').trim();
      if (!query) return;

      const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
        '&prop=pageimages&piprop=thumbnail&pithumbsize=600' +
        `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
          pages.sort((a, b) => (a?.index ?? 99) - (b?.index ?? 99));
          const hit = pages.find((p) => p?.thumbnail?.source);
          const src = hit?.thumbnail?.source;
          if (src) {
            img.src = window.PPT_CFG.proxyUrl(src);
            img.style.display = 'block';
          }
        })
        .catch(e => console.warn('Fallback image load failed:', e));
    }
  },

  async exportToPDF(fileName = 'presentation') {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      console.error("jsPDF is not loaded!");
      return;
    }

    const originalIndex = this.currentSlideIndex;
    const totalSlides = window.presentationData.slides.length;

    // Create PDF with slide aspect ratio: 800px width, 550px height
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [800, 550]
    });

    // Create an overlay to show exporting status inside the iframe
    const loader = document.createElement('div');
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:system-ui,sans-serif;gap:12px;';
    loader.innerHTML = `
      <div style="font-size:24px;font-weight:bold;">Generating PDF...</div>
      <div id="pdf-progress" style="font-size:16px;color:#a0a0a0;">Page 1 of ${totalSlides}</div>
      <div style="width:200px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-top:8px;">
        <div id="pdf-progress-bar" style="width:0%;height:100%;background:#8b5cf6;transition:width 0.1s ease;"></div>
      </div>
    `;
    document.body.appendChild(loader);

    try {
      for (let i = 0; i < totalSlides; i++) {
        // Update loader progress
        const prog = document.getElementById('pdf-progress');
        const progBar = document.getElementById('pdf-progress-bar');
        if (prog) prog.textContent = `Rendering slide ${i + 1} of ${totalSlides}`;
        if (progBar) progBar.style.width = `${((i) / totalSlides) * 100}%`;

        // Switch slide and render synchronously
        this.currentSlideIndex = i;
        const slide = window.presentationData.slides[i];
        this.renderSlide(slide, window.presentationData.theme, window.presentationData.design);

        // Wait a small amount (250ms) to ensure KaTeX math layout, styles, and proxy images stabilize/render
        await new Promise(resolve => setTimeout(resolve, 250));

        // Capture the canvas element using html2canvas
        const canvas = document.getElementById('slide-canvas');
        const captureCanvas = await html2canvas(canvas, {
          scale: 2, // High resolution print scaling
          useCORS: true,
          allowTaint: true,
          logging: false
        });

        const imgData = captureCanvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage([800, 550], 'landscape');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 800, 550);
      }

      // Restore original slide index
      this.currentSlideIndex = originalIndex;
      const originalSlide = window.presentationData.slides[originalIndex];
      this.renderSlide(originalSlide, window.presentationData.theme, window.presentationData.design);
      this.renderThumbnails(window.presentationData.slides, window.presentationData.theme);

      // Save the generated PDF file
      pdf.save(`${fileName.replace(/[\s\/\\:*?"<>|]+/g, '_')}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      // Remove loader overlay
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }
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
    this.renderSlide(slides[index], window.presentationData.theme, window.presentationData.design);

    // Update active thumbnail
    const thumbs = document.querySelectorAll('.slide-thumb');
    thumbs.forEach((t, i) => t.classList.toggle('active', i === index));

    // Scroll active thumbnail into view without shifting parent page layout
    const activeThumb = thumbs[index];
    if (activeThumb) {
      const container = document.getElementById('slide-thumbnails');
      if (container) {
        const thumbLeft = activeThumb.offsetLeft;
        const thumbWidth = activeThumb.offsetWidth;
        const containerWidth = container.clientWidth;
        container.scrollTo({
          left: thumbLeft - (containerWidth / 2) + (thumbWidth / 2),
          behavior: 'smooth'
        });
      }
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
    this.renderSlide(slide, window.presentationData.theme, window.presentationData.design);

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

// Listen for window resize to scale slide content dynamically (responsively)
window.addEventListener('resize', () => {
  const canvas = document.getElementById('slide-canvas');
  if (canvas && window.presentationData) {
    const slide = window.presentationData.slides[window.SlidePreview.currentSlideIndex];
    if (slide) {
      const width = canvas.offsetWidth || 800;
      canvas.style.fontSize = `${Math.max(8, (width / 800) * 16)}px`;
    }
  }
});
