/* ============================================================
 * app.js — Main Application Controller
 * ============================================================
 * Orchestrates the full flow: setup → loading → preview.
 * Initialises all modules and wires top-level event listeners.
 *
 * Load order: 5th — LAST (depends on: api, preview, editor, pptExport)
 * ============================================================ */

/* ----------------------------------------------------------
 * Global Theme Definitions
 * ---------------------------------------------------------- */

window.THEMES = {
  'dark-professional': {
    name: 'Dark Professional',
    bgGradient: ['1a1a2e', '16213e'],
    accent: 'e94560',
    textColor: 'ffffff',
    subtextColor: 'b0b0b0',
    fontHead: 'Calibri Light',
    fontBody: 'Calibri'
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    bgGradient: ['0c2d48', '145374'],
    accent: '2e8bc0',
    textColor: 'ffffff',
    subtextColor: 'a0c4d8',
    fontHead: 'Arial',
    fontBody: 'Arial'
  },
  'warm-sunset': {
    name: 'Warm Sunset',
    bgGradient: ['2d132c', '801336'],
    accent: 'ee4540',
    textColor: 'ffffff',
    subtextColor: 'd4a0a0',
    fontHead: 'Georgia',
    fontBody: 'Georgia'
  },
  'forest-green': {
    name: 'Forest Green',
    bgGradient: ['1b2a1b', '2d4a2d'],
    accent: '5cdb95',
    textColor: 'ffffff',
    subtextColor: 'a0c8a0',
    fontHead: 'Verdana',
    fontBody: 'Verdana'
  },
  'royal-purple': {
    name: 'Royal Purple',
    bgGradient: ['1a1035', '2d1b69'],
    accent: 'b24bf3',
    textColor: 'ffffff',
    subtextColor: 'b8a0d8',
    fontHead: 'Segoe UI',
    fontBody: 'Segoe UI'
  },
  'clean-white': {
    name: 'Clean White',
    bgGradient: ['ffffff', 'ffffff'],
    accent: '2563eb',
    textColor: '0f172a',
    subtextColor: '475569',
    fontHead: 'Calibri',
    fontBody: 'Calibri'
  }
};

/* ----------------------------------------------------------
 * Application Controller
 * ---------------------------------------------------------- */

window.App = {

  /** Currently active view: 'setup' or 'preview' */
  currentView: 'setup',

  /** 'ebook' (default), 'lecture', or 'both' — which source(s) to ground the
   *  deck on. Only offered when a lecture transcript is actually indexed for
   *  this scope and the institute has lecture grounding enabled (see
   *  loadSourceAvailability). */
  sourceMode: 'ebook',

  /* ========================================================
   * Initialization
   * ======================================================== */

  /**
   * Bootstrap the entire application.
   * Called once from DOMContentLoaded.
   */
  init() {
    this.setupEventListeners();
    this.initSliderSync();
    this.initThemePicker();
    this.initStylePicker();
    this.initSourceModePicker();
    this.initSlideStylePicker();
    this.initScopeToggle();
    this.initTopicCounter();
    this.initThemeFilter();

    // Initialize the editor module
    if (window.SlideEditor) {
      window.SlideEditor.init();
    }

    // Check if loading as a read-only viewer
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'viewer') {
      document.body.classList.add('viewer-mode');
      // Show loading status inside setup view container or overlay
      this.showLoading('Loading presentation preview…', 'Connecting…');
      
      // Listen for slide markdown data from host page
      window.addEventListener('message', (e) => {
        const t = e?.data?.type;
        if (t === 'EDVA_PPT_VIEWER_LOAD') {
          const markdown = e.data.markdown;
          const title = e.data.title || 'Presentation';
          const theme = e.data.theme || 'clean-white';
          const design = e.data.design || 'executive';

          // A V2 deck saves its full specification alongside the markdown
          // (see v2Deck.js); prefer it, or the deck reopens as V1 bullets.
          // Decks saved before that, and V1 decks, still come from markdown.
          const savedV2 = window.PPTV2Deck ? window.PPTV2Deck.extract(markdown) : null;
          window.presentationData = savedV2
            ? { ...savedV2, title: savedV2.title || title, theme, design,
                materialId: e.data.materialId }
            : {
                title,
                slides: this.parseMarkdownToSlides(markdown),
                theme,
                design,
                materialId: e.data.materialId
              };

          this.hideLoading();
          this.showPreview();
        } else if (t === 'EDVA_PPT_EXPORT_PDF') {
          if (window.SlidePreview && typeof window.SlidePreview.exportToPDF === 'function') {
            window.SlidePreview.exportToPDF(e.data.fileName || 'presentation');
          }
        }
      });
      return;
    }

    // Ensure we start on the setup view
    this.showView('setup');

    // Prefill from URL (used when embedded in the EDVA teacher panel):
    //   ?topic=Photosynthesis&slides=8&lang=en&auto=1
    this.applyUrlPrefill();

    const bg = document.getElementById('loading-background-btn');
    if (bg) bg.addEventListener('click', () => this.sendToBackground());
    // Opened from Course Content's list of decks made in the background.
    if (window.PPT_CFG && window.PPT_CFG.job) this.resumeJob(window.PPT_CFG.job);
  },

  /* Parses markdown string back into slides array structure */
  parseMarkdownToSlides(md) {
    const lines = (md || '').split(/\r?\n/);
    const slides = [];
    let current = null;

    const cleanStr = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/^[*_~\s]+|[*_~\s]+$/g, '').trim();

    const flush = () => {
      if (current && (current.title || current.bullets.length)) slides.push(current);
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || /^[-=]{3,}$/.test(line)) continue;

      const heading = line.match(/^#{1,4}\s+(.*)$/);
      if (heading) {
        flush();
        let title = cleanStr(heading[1]);
        const slideMatch = title.match(/^slide\s*\d+\s*[:\-.]?\s*(.*)$/i);
        if (slideMatch) title = cleanStr(slideMatch[1]) || `Slide ${slides.length + 1}`;
        current = { title: title || `Slide ${slides.length + 1}`, bullets: [], type: 'content' };
        continue;
      }

      if (!current) current = { title: `Slide ${slides.length + 1}`, bullets: [], type: 'content' };

      const mdImg = line.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (mdImg) {
        const src = mdImg[1];
        if (src.startsWith('data:image')) {
          current.imageBase64 = src;
        } else {
          current.imageUrl = src;
        }
        continue;
      }

      // Sizing comments
      const sizeMatch = line.match(/<!--\s*SIZE:\s*([^\s-]+)\s*-->/i);
      if (sizeMatch) {
        current.imageSize = sizeMatch[1];
        continue;
      }
      const fitMatch = line.match(/<!--\s*FIT:\s*([^\s-]+)\s*-->/i);
      if (fitMatch) {
        current.imageFit = fitMatch[1];
        continue;
      }
      const posMatch = line.match(/<!--\s*POSITION:\s*(.+?)\s*-->/i);
      if (posMatch) {
        current.imagePosition = posMatch[1].trim();
        continue;
      }

      // Ignore general HTML comment lines
      if (line.startsWith('<!--') && line.endsWith('-->')) {
        continue;
      }

      const imgLine = line.match(/^(?:image|visual|picture|illustration)\s*[:\-]\s*(.+)$/i);
      if (imgLine) {
        current.imagePrompt = cleanStr(imgLine[1]);
        continue;
      }

      const bullet = line.match(/^[-*+]\s+(.*)$/) || line.match(/^\d+[).]\s+(.*)$/);
      const text = cleanStr(bullet ? bullet[1] : line);
      if (!text) continue;
      current.bullets.push(text);
    }
    flush();

    // Map first slide to title slide type, and last to summary slide type if appropriate
    if (slides.length > 0) slides[0].type = 'title';
    if (slides.length > 1) slides[slides.length - 1].type = 'summary';

    return slides;
  },

  /* Prefill the setup form from query params and optionally auto-generate. */
  applyUrlPrefill() {
    try {
      const params = new URLSearchParams(window.location.search);
      const topic = (params.get('topic') || '').trim();
      if (topic) {
        const topicInput = document.getElementById('topic-input');
        if (topicInput) topicInput.value = topic.slice(0, 200);
        this._updateTopicCount();
      }

      // Curriculum scope forwarded by Topic Management. IDs are what actually
      // scope the deck (the backend resolves names from them); the names are
      // used here only to show the teacher what the deck will be scoped to.
      this.scope = {
        classId:     params.get('classId')     || '',
        subjectId:   params.get('subjectId')   || '',
        chapterId:   params.get('chapterId')   || '',
        topicId:     params.get('topicId')     || '',
        className:   params.get('className')   || '',
        subjectName: params.get('subjectName') || '',
        chapterName: params.get('chapterName') || '',
        topicName:   params.get('topicName')   || '',
      };
      this.renderScopeBanner();
      this.renderSlideCountMode();
      this.loadSourceAvailability();
      const slides = parseInt(params.get('slides') || '', 10);
      // An explicit count in the link is a request for exactly that many.
      if (Number.isFinite(slides)) this.setSlideCount(slides);
      const lang = params.get('lang');
      if (lang) {
        const langSel = document.getElementById('language-select');
        if (langSel) langSel.value = lang;
      }
      // Auto-start generation when requested and a topic is present.
      if (topic && params.get('auto') === '1') {
        setTimeout(() => this.handleGenerate(), 300);
      }
    } catch (_e) {
      /* prefill is best-effort */
    }
  },

  /* Show the teacher exactly what curriculum scope the deck will be written for,
     so an unscoped (free-text) deck is visibly different from a scoped one. */
  renderScopeBanner() {
    const box = document.getElementById('scope-banner');
    const textEl = document.getElementById('scope-text');
    if (!box || !textEl) return;
    const details = document.getElementById('scope-details');
    const aligned = document.getElementById('curriculum-aligned');
    const s = this.scope || {};
    const head = [s.className, s.subjectName].filter(Boolean).join(' – ');
    const parts = [head, s.chapterName, s.topicName].filter(Boolean);
    const sep = '<svg class="ps-scope-sep" viewBox="0 0 24 24" width="14" height="14" fill="none" '
      + 'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" '
      + 'aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
    textEl.innerHTML = parts.length
      ? parts.map((p) => '<span>' + this._escape(p) + '</span>').join(sep)
      : 'No curriculum selected — slides follow your topic';
    box.classList.toggle('is-empty', !parts.length);

    // Without a class the AI has no grade to pitch at and will guess, which is
    // how a Class 10 topic ends up with college-level slides. Say so up front
    // rather than letting the teacher discover it in the generated deck.
    const missingClass = parts.length > 0 && !s.className;
    box.classList.toggle('is-warn', missingClass);
    if (aligned) {
      aligned.hidden = !parts.length || missingClass;
      aligned.title = this.ebookAvailable === false
        ? 'Written for this class and syllabus. No textbook is indexed for this chapter yet.'
        : 'Written for this class and syllabus, from your school’s own textbook.';
    }
    if (!details) return;
    const scopeKind = s.topicName ? 'this topic only'
      : s.chapterName ? 'this whole chapter' : s.subjectName ? 'this subject' : '';
    const rows = [['Class', s.className], ['Subject', s.subjectName],
                  ['Chapter', s.chapterName], ['Topic', s.topicName]]
      .filter(([, v]) => v)
      .map(([k, v]) => '<div class="ps-scope-row"><span>' + k + '</span><strong>'
        + this._escape(v) + '</strong></div>');
    details.innerHTML = parts.length
      ? rows.join('') + '<p class="ps-scope-kind">Slides will cover ' + scopeKind + '.</p>'
        + (missingClass
          ? '<p class="ps-scope-warn">No class detected for this subject, so slides may not be '
            + 'pitched at the right grade. Open this from a class in Topic Management, or check '
            + 'the subject is linked to a class.</p>'
          : '')
      : '<p class="ps-scope-kind">Open PPT Studio from a topic or chapter in Course Content to '
        + 'write the deck from your textbook, for that class.</p>';
  },

  /* The chevron on the curriculum box opens the full scope. */
  initScopeToggle() {
    const box = document.getElementById('scope-banner');
    const details = document.getElementById('scope-details');
    if (!box || !details) return;
    box.addEventListener('click', () => {
      const open = details.hidden;
      details.hidden = !open;
      box.setAttribute('aria-expanded', String(open));
    });
  },

  /* Topic length, as the counter under the field shows it. */
  initTopicCounter() {
    const input = document.getElementById('topic-input');
    if (!input) return;
    input.addEventListener('input', () => this._updateTopicCount());
    this._updateTopicCount();
  },

  _updateTopicCount() {
    const input = document.getElementById('topic-input');
    const count = document.getElementById('topic-count');
    if (input && count) count.textContent = input.value.length + '/' + (input.maxLength > 0 ? input.maxLength : 200);
  },

  /* The chips under the themes narrow the cards by style; the chosen theme
   * stays chosen even when a filter hides it. */
  initThemeFilter() {
    const chips = document.querySelectorAll('.ps-chip[data-theme-filter]');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.themeFilter;
        chips.forEach((c) => {
          c.classList.toggle('selected', c === chip);
          c.setAttribute('aria-pressed', String(c === chip));
        });
        document.querySelectorAll('.theme-card[data-tags]').forEach((card) => {
          const tags = (card.dataset.tags || '').split(/\s+/);
          card.hidden = filter !== 'all' && tags.indexOf(filter) < 0;
        });
      });
    });
  },

  _escape(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  },

  /* Show the "Generate from" picker only when this scope actually has an
     indexed lecture transcript AND the institute has lecture grounding
     enabled — otherwise generation stays textbook-only, exactly as before. */
  async loadSourceAvailability() {
    const section = document.getElementById('sec-source-mode');
    if (!section || !this.scope || (!this.scope.chapterId && !this.scope.topicId)) return;
    const availability = await API.getSourceAvailability(this.scope);
    if (availability && typeof availability.ebookAvailable === 'boolean') {
      this.ebookAvailable = availability.ebookAvailable;
    }
    this.renderSlideCountMode();
    this.renderScopeBanner();
    const show = !!(availability && availability.lectureGroundingEnabled && availability.lectureAvailable);
    section.hidden = !show;
    if (!show) {
      this.sourceMode = 'ebook';
      return;
    }
    const ebookAvailable = availability.ebookAvailable !== false;
    document.querySelectorAll('.source-mode-btn').forEach((btn) => {
      const mode = btn.dataset.sourceMode;
      btn.disabled = (mode === 'ebook' || mode === 'both') && !ebookAvailable;
      btn.title = btn.disabled ? 'No indexed textbook for this chapter yet' : '';
    });
    this.renderSourceModeHint();
  },

  renderSourceModeHint() {
    const hint = document.getElementById('source-mode-hint');
    if (!hint) return;
    const HINTS = {
      ebook: 'Written from the chapter PDF only.',
      lecture: 'Written from this topic’s recorded-lecture transcript(s) only.',
      both: 'Written from the chapter PDF and this topic’s recorded-lecture transcript(s).',
    };
    hint.textContent = HINTS[this.sourceMode] || '';
  },

  /* Slide style: 'v2' (designed, editable) or 'image' (each slide painted by
   * an image model). Remembered per browser so a tester comparing the two
   * does not have to re-pick it every time. */
  _SLIDE_STYLE_HINTS: {
    v2: 'Editable slides built from text, icons and one picture each.',
    image: 'Always 10 slides, each painted as one AI image. Looks finished, but the text cannot be edited; it is kept in the speaker notes. Takes about 2–3 minutes.',
  },

  DEFAULT_SLIDE_STYLE: 'image',

  initSlideStylePicker() {
    const buttons = document.querySelectorAll('.slide-style-btn');
    if (!buttons.length) return;
    // Image slides are the starting choice every time the studio opens (product
    // decision, 2026-10-10). A teacher can still pick Designed for this deck;
    // the choice is deliberately not remembered for the next visit.
    this.slideStyle = this.DEFAULT_SLIDE_STYLE;
    const apply = () => {
      buttons.forEach((b) => {
        const on = b.dataset.slideStyle === this.slideStyle;
        b.classList.toggle('selected', on);
        b.setAttribute('aria-pressed', String(on));
      });
      const hint = document.getElementById('slide-style-hint');
      if (hint) hint.textContent = this._SLIDE_STYLE_HINTS[this.slideStyle] || '';
      this._syncPresentationStyle();
      this._syncSlideCountField();
    };
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.slideStyle = btn.dataset.slideStyle || this.DEFAULT_SLIDE_STYLE;
        apply();
      });
    });
    apply();
  },

  /* Presentation Style only shapes the older generator's slides. Designed
   * and painted decks lay themselves out, so offering it there was a control
   * that did nothing; it is hidden for them. */
  _syncPresentationStyle() {
    const section = document.getElementById('sec-style');
    if (!section) return;
    section.hidden = this.slideStyle === 'v2' || this.slideStyle === 'image';
  },

  /* Image decks are always IMAGE_DECK_SLIDES long, so their count is not
   * offered: the field is hidden while Image slides is chosen. */
  _syncSlideCountField() {
    const section = document.getElementById('sec-slides');
    if (section) section.hidden = this.slideStyle === 'image';
  },

  initSourceModePicker() {
    const buttons = document.querySelectorAll('.source-mode-btn');
    if (!buttons.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        buttons.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.sourceMode = btn.dataset.sourceMode || 'ebook';
        this.renderSourceModeHint();
      });
    });
  },

  /* ========================================================
   * Event Listeners
   * ======================================================== */

  setupEventListeners() {
    // ---- Generate button -----------------------------------
    const genBtn = document.getElementById('generate-btn');
    if (genBtn) {
      genBtn.addEventListener('click', () => this.handleGenerate());
    }

    // ---- Back to setup button ------------------------------
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showView('setup'));
    }

    // ---- Download PPT button -------------------------------
    const dlBtn = document.getElementById('download-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => this.handleDownload());
    }

    // ---- Save to EDVA Course Content (only meaningful when embedded) ----
    const saveBtn = document.getElementById('save-edva-btn');
    if (saveBtn) {
      // Hide the save button when not embedded inside the EDVA panel.
      if (window.parent === window) saveBtn.style.display = 'none';
      saveBtn.addEventListener('click', () => this.handleSaveToEdva());
    }
    // Acknowledgement from the EDVA parent after a save attempt.
    window.addEventListener('message', (e) => {
      const t = e?.data?.type;
      if (t === 'EDVA_PPT_SAVE_PROGRESS') {
        // The page is uploading the file: show how far it has got.
        const pct = Number(e.data.percent);
        this._setSaveBtn(e.data.stage === 'saving' || pct >= 100
          ? 'Finishing…' : 'Uploading… ' + (Number.isFinite(pct) ? Math.round(pct) + '%' : ''));
        return;
      }
      // Only the answers to a save end it: any other message (the page talks
      // to the studio about other things too) used to reset the button mid-save.
      if (t !== 'EDVA_PPT_SAVED' && t !== 'EDVA_PPT_SAVE_ERROR') return;
      if (t === 'EDVA_PPT_SAVED') this.showToast('Saved to Course Content ✅', 'success');
      else this.showToast('Save failed: ' + (e.data.message || 'try again'), 'error');
      this._resetSaveBtn();
    });

    // ---- Slide navigation ----------------------------------
    const prevBtn = document.getElementById('prev-slide-btn');
    const nextBtn = document.getElementById('next-slide-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => SlidePreview.prevSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => SlidePreview.nextSlide());

    // ---- Keyboard navigation (arrows) ----------------------
    document.addEventListener('keydown', (e) => {
      if (this.currentView !== 'preview') return;

      // Don't hijack arrows when the user is typing in an input
      const tag = (e.target.tagName || '').toLowerCase();
      const isEditable = e.target.isContentEditable || tag === 'input' || tag === 'textarea';
      if (isEditable) return;

      if (e.key === 'ArrowLeft')  { e.preventDefault(); SlidePreview.prevSlide(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); SlidePreview.nextSlide(); }
    });
  },

  /* ========================================================
   * Slider ↔ Display Sync
   * ======================================================== */

  /* Slide count: "Auto (Recommended)" or a number, in one dropdown. Auto
   * means the topic's own textbook content decides the count, at generation
   * time. The choice is remembered per browser. */
  SLIDE_COUNT_MIN: 3,
  SLIDE_COUNT_MAX: 10,          // decks are capped at 10 (server clamps too)
  // Image (painted) decks are always this long; no count is offered for them.
  IMAGE_DECK_SLIDES: 10,

  initSlideCountMode() {
    const select = document.getElementById('slide-count-select');
    if (!select) return;
    if (select.options.length < 2) {
      for (let n = this.SLIDE_COUNT_MIN; n <= this.SLIDE_COUNT_MAX; n++) {
        const opt = document.createElement('option');
        opt.value = String(n);
        opt.textContent = n + ' slides';
        select.appendChild(opt);
      }
    }
    let saved = null;
    try { saved = localStorage.getItem('ppt_slide_count'); } catch (_e) { /* private mode */ }
    if (saved && Array.from(select.options).some((o) => o.value === saved)) select.value = saved;
    select.addEventListener('change', () => {
      try { localStorage.setItem('ppt_slide_count', select.value); } catch (_e) { /* ignore */ }
      this.renderSlideCountMode();
    });
    this.renderSlideCountMode();
  },

  /* Ask for exactly `n` slides (clamped to what the server accepts). */
  setSlideCount(n) {
    const select = document.getElementById('slide-count-select');
    if (!select) return;
    const value = Math.max(this.SLIDE_COUNT_MIN, Math.min(this.SLIDE_COUNT_MAX, Math.round(n)));
    select.value = String(value);
    this.renderSlideCountMode();
  },

  renderSlideCountMode() {
    const select = document.getElementById('slide-count-select');
    this.slideCountAuto = !select || select.value === 'auto';
    // What Auto will do is said on hover, in the teacher's terms.
    if (select) select.title = this.slideCountAuto
      ? this._autoCountExplanation()
      : 'Exactly ' + select.value + ' slides.';
  },

  /* What Automatic will do for this scope, in the teacher's terms. */
  _autoCountExplanation() {
    const s = this.scope || {};
    const noBook = this.ebookAvailable === false;
    if (noBook) {
      return 'No textbook is indexed for this chapter yet, so the deck is sized to the topic itself, '
        + 'usually 6 to 10 slides. You will see the exact number as soon as it is planned.';
    }
    if (s.topicName) {
      return 'When you generate, the AI reads what your textbook says about ' + s.topicName
        + ' and gives one slide to each idea it teaches, usually 5 to 10 slides, '
        + 'never padded and never cramped. You will see the exact number as soon as it is planned.';
    }
    if (s.chapterName) {
      return 'When you generate, the AI reads the ' + s.chapterName + ' chapter in your textbook and '
        + 'gives one slide to each idea it teaches, from 5 slides for a short chapter up to 10 for a '
        + 'long one. You will see the exact number as soon as it is planned.';
    }
    return 'When you generate, the AI decides how many slides this topic needs, one for each idea '
      + 'it teaches. You will see the exact number as soon as it is planned.';
  },

  /* What to ask for: 'auto', or the chosen number. */
  slideCountRequest() {
    if (this.slideStyle === 'image') return this.IMAGE_DECK_SLIDES;
    const select = document.getElementById('slide-count-select');
    if (!select || select.value === 'auto') return 'auto';
    return parseInt(select.value, 10) || 8;
  },

  initSliderSync() {
    this.initSlideCountMode();
  },

  /* ========================================================
   * Theme Picker
   * ======================================================== */

  /* "Match the subject" (data-theme="subject") is the default: each subject
   * gets its own palette. The other cards colour V2 and image decks too, not
   * only the older generator. The pick is remembered per browser, like the
   * slide style. */
  initThemePicker() {
    const cards = document.querySelectorAll('.theme-card');
    if (!cards.length) return;

    const select = (card) => {
      cards.forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed', 'false'); });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
    };
    cards.forEach(card => {
      card.addEventListener('click', () => {
        select(card);
        try { localStorage.setItem('ppt_deck_theme', card.dataset.theme || ''); } catch (_e) { /* ignore */ }
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    let saved = '';
    try { saved = localStorage.getItem('ppt_deck_theme') || ''; } catch (_e) { /* private mode */ }
    const remembered = Array.from(cards).find(c => c.dataset.theme === saved);
    const initial = remembered || document.querySelector('.theme-card.selected') || cards[0];
    select(initial);
  },

  /** The theme card the teacher picked: 'subject' or a studio theme key. */
  selectedDeckTheme() {
    return document.querySelector('.theme-card.selected')?.dataset.theme || 'subject';
  },

  /** The older generator's renderer knows only the six named themes; a
   *  subject-coloured deck that falls back to it is drawn in Clean White. */
  v1ThemeFor(deckTheme) {
    return deckTheme && window.THEMES[deckTheme] ? deckTheme : 'clean-white';
  },

  initStylePicker() {
    const cards = document.querySelectorAll('.style-card');
    if (!cards.length) return;

    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed', 'false'); });
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    const anySelected = document.querySelector('.style-card.selected');
    if (!anySelected && cards.length > 0) cards[0].classList.add('selected');
  },

  /* ========================================================
   * Generate Presentation Flow
   * ======================================================== */

  async handleGenerate(options = {}) {
    // ---- Validate inputs ------------------------------------
    const topic = (document.getElementById('topic-input').value || '').trim();
    if (!topic) {
      this.showToast('Please enter a topic for your presentation!', 'error');
      // Briefly shake the input for visual feedback
      const input = document.getElementById('topic-input');
      if (input) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
      }
      return;
    }

    this._showFallbackNotice(null);          // a new deck; clear an old notice
    this._showCachedNotice(null);
    const slideCount = this.slideCountRequest();
    const deckTheme  = this.selectedDeckTheme();
    const theme      = this.v1ThemeFor(deckTheme);
    const design     = document.querySelector('.style-card.selected')?.dataset.style || 'executive';
    const language   = document.getElementById('language-select').value || 'en';

    // ---- Show loading overlay -------------------------------
    this.showLoading(
      'Generating your presentation…',
      'Step 1 of 3: Creating AI content…'
    );
    this._renderLoadingScope(topic);
    this.updateProgress(10);

    try {
      // Step 1 — Content generation
      this.updateLoadingStatus(
        'Generating content with AI…',
        'Step 1 of 3: Creating slide content…'
      );
      this.updateProgress(20);

      if (this.slideStyle === 'image') {
        this.updateLoadingStatus(
          'Painting your slides…',
          'Each slide is drawn as one image — this takes 1–2 minutes.'
        );
      }
      // A background job when the server has one: real progress, and the
      // deck opens as soon as its text exists while pictures are still
      // arriving. Otherwise the one-request call, exactly as before.
      const jobId = await API.startPresentation(topic, slideCount, theme, language,
                                                this.scope, this.sourceMode, this.slideStyle,
                                                deckTheme, { fresh: !!(options && options.fresh) });
      if (jobId) this._trackJob(jobId);
      const result = jobId
        ? await this._followJob(jobId, theme, design)
        : await API.generatePresentation(topic, slideCount, theme, language,
                                         this.scope, this.sourceMode, this.slideStyle,
                                         deckTheme);
      if (result && result._backgrounded) return;   // the teacher went on working
      await this._presentResult(result, theme, design);
    } catch (error) {
      this.hideLoading();
      this.showToast(error.message || 'Failed to generate presentation. Please try again.', 'error');
      console.error('Generation error:', error);
    }
  },

  /* A finished deck on screen: the same for one just made and one resumed. */
  async _presentResult(result, theme, design) {
    this._showFallbackNotice(result);
    this._showCachedNotice(result);
    this._untrackJob(true);
    {
      if (window.presentationData && window.presentationData._partial) {
        // Already on screen; finish it in place.
        this._applyFinalDeck(result);
        const took = this._loadStartAt ? (Date.now() - this._loadStartAt) : null;
        if (result && result._incomplete) {
          this.showToast('Your slides are ready, but some pictures could not be added.', 'info');
        } else if (took != null) {
          this.showToast('Presentation ready in ' + this._fmtDuration(took), 'success');
        }
        return;
      }

      // Step 2 — Images (if the API handled it, just show progress)
      this.updateLoadingStatus(
        'Processing images…',
        'Step 2 of 3: Fetching slide images…'
      );
      this.updateProgress(70);

      // Step 3 — Prepare preview
      this.updateLoadingStatus(
        'Almost done!',
        'Step 3 of 3: Preparing preview…'
      );
      this.updateProgress(90);

      // Store data globally
      window.presentationData = {
        ...result,
        theme:  theme,
        design: design
      };

      this.updateProgress(100);

      // Brief pause so the user sees 100 %
      await this._sleep(500);

      const took = this._loadStartAt ? (Date.now() - this._loadStartAt) : null;
      this.hideLoading();
      this.showPreview();
      if (result && result._incomplete) {
        this.showToast('Your slides are ready, but some pictures could not be added.', 'info');
      } else if (took != null) {
        this.showToast('Presentation generated in ' + this._fmtDuration(took), 'success');
      }
    }
  },

  /* ========================================================
   * Background decks
   * ======================================================== */

  /* The deck being followed. Offer to continue it in the background when the
   * studio is embedded in EDVA (the page that can take the teacher elsewhere). */
  _trackJob(jobId) {
    this._currentJobId = jobId;
    this._backgrounded = false;
    const box = document.getElementById('loading-background');
    if (box) box.hidden = !(window.parent && window.parent !== window);
  },

  /* Done with the deck in this studio; ``opened``: it is on screen, so it
   * leaves the teacher's "in the background" list. */
  _untrackJob(opened) {
    const box = document.getElementById('loading-background');
    if (box) box.hidden = true;
    if (opened && this._currentJobId && window.API && API.dismissJob) API.dismissJob(this._currentJobId);
    this._currentJobId = null;
  },

  /* Leave the deck generating and go back to work: the EDVA page navigates to
   * Course Content, where AI Generate shows its progress and opens it when ready. */
  sendToBackground() {
    if (!this._currentJobId) return;
    this._handOff(this._currentJobId, 'teacher', new Error('Not inside EDVA'));
  },

  /* Open a deck made (or still being made) in the background. */
  async resumeJob(jobId) {
    const deckTheme = this.selectedDeckTheme();
    const theme = this.v1ThemeFor(deckTheme);
    const design = document.querySelector('.style-card.selected')?.dataset.style || 'executive';
    this.showLoading('Opening your presentation…', 'Checking on it…');
    this._renderLoadingScope(((document.getElementById('topic-input') || {}).value || '').trim());
    this._trackJob(jobId);
    try {
      const result = await this._followJob(jobId, theme, design);
      if (result && result._backgrounded) return;
      await this._presentResult(result, theme, design);
    } catch (error) {
      this._untrackJob(false);
      this.hideLoading();
      this.showToast((error && error.message) || 'This presentation could not be opened. Please generate it again.', 'error');
    }
  },

  /* ========================================================
   * Background generation
   * ======================================================== */

  _JOB_STAGES: {
    queued: 'Starting…',
    planning: 'Reading your chapter and planning the slides…',
    writing: 'Writing the slides…',
    composing: 'Laying out the slides…',
    pictures: 'Adding pictures…',
  },
  _JOB_PROGRESS: { queued: 10, planning: 30, writing: 40, composing: 60, pictures: 75 },

  /* Poll a background deck until it is done. Opens the deck as soon as its
   * slides exist and keeps filling pictures in. Resolves to the finished
   * deck data (or what exists, flagged _incomplete, if it failed late). */
  // How long the studio follows a deck on screen, and how long it keeps
  // trying to reach the server, before it hands the deck to the teacher's
  // background list. The deck itself keeps generating on the server either way.
  FOLLOW_MAX_MS: 8 * 60 * 1000,
  LOST_CONTACT_MS: 3 * 60 * 1000,

  async _followJob(jobId, theme, design) {
    const started = Date.now();
    let shown = false;
    let last = null;
    let lostSince = null;
    for (;;) {
      // Back off while the server cannot be reached (a backend restart takes
      // about 90s): up to 10s between tries.
      const lostFor = lostSince ? Date.now() - lostSince : 0;
      await this._sleep(lostSince ? Math.min(10000, 2000 + lostFor / 6) : (shown ? 2500 : 1500));
      if (this._backgrounded) return { _backgrounded: true };
      let job;
      try {
        job = await API.getPresentationStatus(jobId);
        lostSince = null;
      } catch (err) {
        if (err && err.status === 404) {
          throw new Error('This presentation is no longer available. Please generate it again.');
        }
        // Not a failed deck: the server (or the network) is briefly out of
        // reach, and the deck goes on being made. It used to be reported as
        // failed after five dropped checks - about ten seconds.
        if (!lostSince) lostSince = Date.now();
        if (!shown) {
          this.updateLoadingStatus('Reconnecting…',
            'Your presentation is still being made. Checking again in a moment.');
        }
        if (Date.now() - lostSince > this.LOST_CONTACT_MS) {
          return this._handOff(jobId, 'offline', new Error(
            'We lost contact with the server, but your presentation is still being made. '
            + 'Find it under AI Generate in Course Content.'));
        }
        continue;
      }
      if (job.partial) last = job.partial;
      if (job.scope) this._confirmLoadingScope(job.scope);
      if (job.status === 'done') {
        const r = job.result || {};
        return r.data || r;
      }
      // What exists so far is worth keeping when the deck fails late: the
      // slides already on screen, or the pictures already painted.
      const keep = last && last.slides && last.slides.length
        && (shown || this._paintedSoFar(last) > 0);
      if (job.status === 'failed') {
        if (keep) return Object.assign({}, last, { _incomplete: true });
        throw new Error(job.error || 'Generation failed. Please try again.');
      }

      const label = this._headline(job);
      const count = job.total ? ` ${job.done || 0} of ${job.total}` : '';
      const current = this._currentActivity(job.activity);
      if (!shown && job.status === 'queued') {
        // Waiting for a worker (busy hour): say so, with the place in line.
        this.updateLoadingStatus('Waiting for a free presentation generator…', this._queueText(job.queuePosition));
        this.updateProgress(2);
      } else if (!shown) {
        this.updateLoadingStatus(label, job.stage === 'pictures'
          ? 'Pictures ready:' + count : 'This usually takes about a minute.');
        this.updateProgress(this._jobPercent(job));
        this.renderActivity(job.activity);
        // A designed deck opens as soon as its text exists. A painted deck
        // has nothing to show until its pictures arrive - opened early, it
        // was a row of "Painting this slide…" placeholders - so it stays on
        // the loading card, which counts the pictures, until it is done.
        if (last && last.slides && last.slides.length && !this._isPaintedDeck(last)) {
          window.presentationData = Object.assign({}, last, { theme, design, _partial: true });
          this.hideLoading();
          this.showPreview();
          // Whether the deck is from the book is only known when it is done;
          // a "General knowledge" badge in the meantime would be wrong.
          const badge = document.getElementById('source-badge');
          if (badge) badge.hidden = true;
          shown = true;
        }
      } else if (last) {
        this._mergeVisuals(last);
      }
      if (shown) {
        this._setFinishing((current ? current.text : label)
                           + (job.total ? ` · ${job.done || 0} of ${job.total} pictures` : ''));
      }
      if (Date.now() - started > this.FOLLOW_MAX_MS) {
        if (keep) return Object.assign({}, last, { _incomplete: true });
        // Slow is not failed: the deck keeps generating; the teacher hears
        // when it is ready, wherever they are working.
        return this._handOff(jobId, 'slow', new Error(
          'This presentation is taking longer than usual. It is still being made; '
          + 'find it under AI Generate in Course Content.'));
      }
    }
  },

  /* Hand a deck still being made to the teacher's background list (EDVA page
   * goes back to Course Content, which says when it is ready). Outside EDVA
   * there is no list to hand it to, so ``otherwise`` is thrown. */
  _handOff(jobId, reason, otherwise) {
    if (!(window.parent && window.parent !== window)) throw otherwise;
    this._backgrounded = true;
    const topic = (document.getElementById('topic-input') || {}).value || '';
    window.parent.postMessage({ type: 'EDVA_PPT_BACKGROUND', jobId: jobId || this._currentJobId,
                                topic: topic.trim(), reason }, '*');
    this.hideLoading();
    return { _backgrounded: true };
  },

  _queueText(position) {
    if (position == null) return 'Your presentation will start in a moment.';
    if (position === 0) return 'You are next.';
    return position === 1 ? '1 presentation ahead of yours.' : `${position} presentations ahead of yours.`;
  },

  /* A deck of AI-painted slides (each slide one picture), as opposed to
   * designed slides with text the studio draws. */
  _isPaintedDeck(deck) {
    if (this.slideStyle === 'image') return true;
    return ((deck && deck.slides) || []).some(s => s && ('slideImagePending' in s || s.slideImage));
  },

  _paintedSoFar(deck) {
    return ((deck && deck.slides) || []).filter(s => s && s.slideImage
      && (s.slideImage.url || s.slideImage.base64)).length;
  },

  /* ========================================================
   * "Creating presentation for …" in the loading card
   * ======================================================== */

  /* A teacher reported decks for one topic coming out about another. The
   * card names the deck the moment generation starts (from the scope the
   * studio was opened with), then checks it against the scope the server
   * says it is generating for: confirmed, or a clear warning. */
  _renderLoadingScope(topic) {
    const box = document.getElementById('loading-scope');
    if (!box) return;
    const s = this.scope || {};
    this._requestedScope = {
      topic: topic || '', topicName: s.topicName || '', chapterName: s.chapterName || '',
      subjectName: s.subjectName || '', className: s.className || '',
    };
    this._scopeConfirmed = false;
    this._paintLoadingScope(this._requestedScope);
    box.classList.remove('is-warn');
    document.getElementById('loading-scope-check').hidden = true;
    document.getElementById('loading-scope-warn').hidden = true;
    box.hidden = false;
  },

  _scopeKind(sc) {
    if (sc.kind) return sc.kind;
    const norm = (v) => String(v || '').trim().toLowerCase();
    if (sc.topicName && norm(sc.topicName) !== norm(sc.chapterName)) return 'topic';
    if (sc.chapterName) return 'chapter';
    return sc.subjectName ? 'subject' : 'free';
  },

  _paintLoadingScope(sc) {
    const norm = (v) => String(v || '').trim().toLowerCase();
    const kind = this._scopeKind(sc);
    const title = kind === 'topic' ? sc.topicName : kind === 'chapter' ? sc.chapterName : sc.topic;
    const meta = kind === 'topic' ? ['Topic', sc.chapterName ? 'Chapter: ' + sc.chapterName : '']
      : kind === 'chapter' ? ['Whole chapter']
      : ['No chapter selected'];
    meta.push(sc.className, sc.subjectName);
    // The topic box can be edited; when it says something other than the
    // scope, show it too, so the teacher sees exactly what was asked for.
    if (sc.topic && norm(sc.topic) !== norm(title)) meta.push('Focus: “' + sc.topic + '”');
    document.getElementById('loading-scope-title').textContent = title || 'Your presentation';
    document.getElementById('loading-scope-meta').textContent = meta.filter(Boolean).join(' · ');
  },

  _confirmLoadingScope(server) {
    const box = document.getElementById('loading-scope');
    if (!box || this._scopeConfirmed || !this._requestedScope) return;
    this._scopeConfirmed = true;
    const req = this._requestedScope;
    const norm = (v) => String(v || '').trim().toLowerCase();
    const differs = (a, b) => a && b && norm(a) !== norm(b);
    const reqName = req.topicName || req.chapterName;
    const serverName = server.topicName || server.chapterName;
    const lost = !!reqName && this._scopeKind(server) === 'free';
    const wrong = differs(req.topicName, server.topicName) || differs(req.chapterName, server.chapterName);
    // The server's names are the ones the deck is written with.
    this._paintLoadingScope(Object.assign({}, server, { topic: server.topic || req.topic }));
    const warn = document.getElementById('loading-scope-warn');
    if (wrong || lost) {
      warn.textContent = lost
        ? 'This is being made without the chapter you opened (“' + reqName + '”), so it will not '
          + 'follow your textbook. Close PPT Studio and open it again from the topic.'
        : 'This is being made for “' + serverName + '”, not “' + reqName + '” that you '
          + 'opened. Close PPT Studio and open it again from the right topic.';
      warn.hidden = false;
      box.classList.add('is-warn');
    } else {
      document.getElementById('loading-scope-check').hidden = false;
    }
  },

  /* How far along a background deck is, from what it has reported. Each
   * stage owns a band of the bar, and the band fills as its steps finish, so
   * the bar never jumps back and never sits still while work is happening. */
  _jobPercent(job) {
    const feed = job.activity || [];
    const done = (prefix) => feed.filter(e => e.key.indexOf(prefix) === 0 && e.state !== 'active').length;
    const all = (prefix) => feed.filter(e => e.key.indexOf(prefix) === 0).length;
    switch (job.stage) {
      case 'queued': return 4;
      case 'planning': {
        const writes = all('write');
        const outline = feed.some(e => e.key === 'outline' && e.state === 'done') ? 6 : 0;
        return 8 + outline + (writes ? Math.round(26 * done('write') / writes) : 0);
      }
      case 'writing': return 40;
      case 'composing': return 44;
      case 'pictures':
        return 48 + (job.total ? Math.round(48 * (job.done || 0) / job.total) : 0);
      default: return 20;
    }
  },

  /* The headline over the timeline: the phase the deck is actually in,
   * read from its steps rather than only the coarse stage. */
  _headline(job) {
    const active = (job.activity || []).filter(e => e.state === 'active').map(e => e.key);
    const has = (p) => active.some(k => k.indexOf(p) === 0);
    if (has('write')) return 'Writing your slides…';
    if (has('textcheck')) return 'Making the text the same size on every slide…';
    if (has('check')) return 'Checking the slides against your textbook…';
    if (has('layout')) return 'Designing the slides…';
    if (has('paint')) return 'Painting your slides…';
    if (has('picture')) return 'Adding pictures…';
    return this._JOB_STAGES[job.stage] || 'Working…';
  },

  /* The step being worked on right now: the newest one still in progress. */
  _currentActivity(feed) {
    const items = feed || [];
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].state === 'active') return items[i];
    }
    return null;
  },

  /* The activity timeline in the loading card. Finished steps get a tick,
   * fallbacks a warning, and steps in progress a spinner; the newest few are
   * shown, so the list stays readable however long the deck runs. */
  renderActivity(feed) {
    const list = document.getElementById('loading-activity');
    if (!list) return;
    const card = list.closest('.loading-card');
    const items = (feed || []).slice();
    if (!items.length) {
      list.hidden = true;
      list.innerHTML = '';
      if (card) card.classList.remove('has-activity');
      return;
    }
    list.hidden = false;
    if (card) card.classList.add('has-activity');
    // In-progress steps first in time order, so what is happening now is
    // always in view; then the most recent finished ones.
    const active = items.filter(e => e.state === 'active');
    const finished = items.filter(e => e.state !== 'active').slice(-Math.max(2, 7 - active.length));
    const shown = finished.concat(active.slice(-5));
    const known = new Set(Array.from(list.children).map(li => li.dataset.key));
    list.innerHTML = '';
    shown.forEach((e, i) => {
      const li = document.createElement('li');
      li.dataset.key = e.key;
      li.className = (e.state === 'active' ? 'is-active' : '')
        + (e.state !== 'active' && i < finished.length - 3 ? ' is-older' : '');
      if (known.has(e.key)) li.style.animation = 'none';   // only new rows slide in
      const icon = document.createElement('span');
      icon.className = 'activity-icon is-' + (e.state || 'active');
      icon.textContent = e.state === 'done' ? '✓' : (e.state === 'warn' ? '!' : '');
      const text = document.createElement('span');
      text.textContent = e.text || '';
      li.appendChild(icon);
      li.appendChild(text);
      if (e.state !== 'active' && e.startedAt && e.at) {
        const secs = Math.max(0, e.at - e.startedAt);
        if (secs >= 1) {
          const time = document.createElement('span');
          time.className = 'activity-time';
          time.textContent = secs < 60 ? Math.round(secs) + 's'
            : Math.floor(secs / 60) + 'm ' + Math.round(secs % 60) + 's';
          li.appendChild(time);
        }
      }
      list.appendChild(li);
    });
  },

  /* Bring newly arrived pictures into the deck on screen. Only the picture
   * fields move: a teacher may already be editing the text. */
  _mergeVisuals(next) {
    const cur = window.presentationData;
    if (!cur || !next || !Array.isArray(next.slides)) return;
    if (!Array.isArray(cur.slides) || cur.slides.length !== next.slides.length) {
      cur.slides = next.slides;
    } else {
      next.slides.forEach((n, i) => {
        const s = cur.slides[i];
        if (n.v2 && s.v2) s.v2.visual = n.v2.visual;
        ['imageUrl', 'imageBase64', 'slideImage', 'slideImagePending', 'slideImageError']
          .forEach((k) => { if (k in n) s[k] = n[k]; else delete s[k]; });
      });
    }
    const idx = (window.SlidePreview && SlidePreview.currentSlideIndex) || 0;
    if (cur.slides[idx]) SlidePreview.renderSlide(cur.slides[idx], cur.theme, cur.design);
  },

  _applyFinalDeck(result) {
    const cur = window.presentationData;
    if (!cur) return;
    const was = cur.generation && cur.generation.version;
    const now = result && result.generation && result.generation.version;
    if (result && Array.isArray(result.slides) && was !== now) {
      // The deck changed kind after it was shown (a late failure fell back to
      // the plain generator): show the deck that was actually produced.
      cur.slides = result.slides;
    } else {
      this._mergeVisuals(result || {});
    }
    ['generation', 'source', 'sourceMode', 'requestedSourceMode', 'sourceModeDowngraded']
      .forEach((k) => { if (result && k in result) cur[k] = result[k]; });
    (cur.slides || []).forEach((s) => {
      if (s.v2 && s.v2.visual) delete s.v2.visual.pending;
      delete s.slideImagePending;
    });
    delete cur._partial;
    this.renderSourceBadge(cur.source);
    const idx = (window.SlidePreview && SlidePreview.currentSlideIndex) || 0;
    if (cur.slides && cur.slides[idx]) SlidePreview.renderSlide(cur.slides[idx], cur.theme, cur.design);
    this._setFinishing(null);
  },

  /* "Adding pictures… 3 of 7" beside the title while the deck finishes.
   * Download and Save wait for it: a file saved now would lack pictures. */
  /* When the style the teacher chose (designed or image slides) could not be
   * made and the standard generator stood in, say so above the deck, with a
   * way to try again - never present the stand-in as what was asked for. */
  _showFallbackNotice(result) {
    let el = document.getElementById('fallback-notice');
    const g = result && result.generation;
    if (!g || !g.fallback) {
      if (el) el.hidden = true;
      return;
    }
    if (!el) {
      const bar = document.querySelector('.preview-topbar');
      if (!bar || !bar.parentNode) return;
      el = document.createElement('div');
      el.id = 'fallback-notice';
      el.className = 'fallback-notice';
      el.setAttribute('role', 'status');
      bar.parentNode.insertBefore(el, bar.nextSibling);
    }
    const what = g.requested === 'image' ? 'Image slides' : 'Designed slides';
    const text = what + ' could not be made this time, because ' + (g.fallbackWhy || 'of an unexpected problem')
      + '. This deck uses the standard style.';
    el.innerHTML = '';
    const msg = document.createElement('span');
    msg.textContent = text;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'fallback-retry';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => this.handleGenerate());
    el.append(msg, retry);
    el.hidden = false;
    this.showToast(text, 'info');
  },

  /* A deck the server had already made for an identical request came back at
   * once. Say so, and offer a new one: a teacher may want different wording. */
  _showCachedNotice(result) {
    let el = document.getElementById('cached-notice');
    const g = result && result.generation;
    if (!g || !g.cached) {
      if (el) el.hidden = true;
      return;
    }
    if (!el) {
      const bar = document.querySelector('.preview-topbar');
      if (!bar || !bar.parentNode) return;
      el = document.createElement('div');
      el.id = 'cached-notice';
      el.className = 'fallback-notice is-info';
      el.setAttribute('role', 'status');
      bar.parentNode.insertBefore(el, bar.nextSibling);
    }
    el.innerHTML = '';
    const msg = document.createElement('span');
    // Shown as it was made: its slide count and theme may differ from the ones
    // picked now (decks are matched by topic and style). "Make a fresh one"
    // makes it exactly as asked.
    msg.textContent = 'Ready instantly: this presentation was made earlier for this topic. '
      + 'Want your own slide count and theme? Make a fresh one.';
    const fresh = document.createElement('button');
    fresh.type = 'button';
    fresh.className = 'fallback-retry';
    fresh.textContent = 'Make a fresh one';
    fresh.addEventListener('click', () => this.handleGenerate({ fresh: true }));
    el.append(msg, fresh);
    el.hidden = false;
  },

  _setFinishing(text) {
    let el = document.getElementById('finishing-banner');
    if (!el) {
      const anchor = document.getElementById('source-badge');
      if (!anchor || !anchor.parentNode) return;
      el = document.createElement('span');
      el.id = 'finishing-banner';
      el.className = 'finishing-banner';
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }
    el.hidden = !text;
    el.textContent = text || '';
    ['download-btn', 'save-edva-btn'].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.disabled = !!text;
      btn.title = text ? 'Finishing your slides…' : '';
    });
  },

  /* ========================================================
   * Show Preview
   * ======================================================== */

  /* Show whether this deck was written from the school's own chapter.
   *
   * The API returns source = { grounded, pages }. That is authoritative:
   * grounding either happened or it did not. Inline [p.N] citations are the
   * model's own doing and appear inconsistently — one deck came back with 11
   * markers and another, equally grounded, with 2 — so they cannot be used to
   * tell a teacher whether their book was used. */
  renderSourceBadge(source) {
    const el = document.getElementById('source-badge');
    if (!el) return;

    if (source && source.grounded) {
      const pages = Array.isArray(source.pages) ? source.pages.filter(Number.isFinite) : [];
      let range = '';
      if (pages.length) {
        const lo = Math.min.apply(null, pages);
        const hi = Math.max.apply(null, pages);
        range = lo === hi ? ` · page ${lo}` : ` · pages ${lo}–${hi}`;
      }
      const bothSources = source.hasEbook && source.hasLecture;
      const label = bothSources
        ? 'From your textbook & lecture'
        : source.hasLecture
          ? 'From your lecture transcript'
          : 'From your textbook' + range;
      el.className = 'source-badge source-badge--grounded';
      el.innerHTML = '<span class="badge-dot"></span>' + label;
      el.title = Array.isArray(source.citations) && source.citations.length
        ? 'Cited: ' + source.citations.join(', ')
        : 'Every slide was written from the chapter PDF uploaded for this class.';
      el.hidden = false;
      return;
    }

    // Not grounded — say WHY, precisely. An indexed chapter that still lands here
    // has a specific, fixable cause (usually exhausted Gemini quota), and a vague
    // "could not be used" sends the teacher to re-upload a book that is already
    // fine. The reason comes from the API (see _generate_grounded in ppt.py).
    var reason = source && source.reason;
    var REASONS = {
      not_indexed:
        'This chapter has no indexed textbook, so the deck was written from general knowledge. Upload the chapter PDF under Textbook Coverage to change that.',
      no_relevant_passages:
        'The chapter is indexed but its scanned text was unusable, so the deck was written from general knowledge. Re-upload a clearer PDF under Textbook Coverage.',
      gemini_exhausted:
        'The chapter IS indexed, but the textbook AI is out of quota right now, so this deck fell back to general knowledge. Try again shortly, or ask an admin to top up the Gemini quota.',
      gemini_overloaded:
        'The chapter IS indexed, but the textbook AI was momentarily overloaded, so this deck fell back to general knowledge. Just generate again — it is usually available within a minute.',
      gemini_key_rejected:
        'The chapter IS indexed, but the textbook AI key was rejected, so this deck fell back to general knowledge. Ask an admin to check the Gemini API key.',
      gemini_model_unavailable:
        'The chapter IS indexed, but the textbook AI model is unavailable for the configured key, so this deck fell back to general knowledge. Ask an admin to check the Gemini setup.',
      gemini_unavailable:
        'The chapter IS indexed, but the textbook AI is not configured on the server, so this deck fell back to general knowledge. Ask an admin to configure Gemini.',
      no_source_available:
        'No indexed textbook or lecture transcript was available for the source you picked, so this deck was written from general knowledge.',
    };
    el.className = 'source-badge source-badge--general';
    el.innerHTML = '<span class="badge-dot"></span>General knowledge';
    el.title = REASONS[reason]
      || 'The textbook could not be used for this deck, so it was written from general knowledge.';
    el.hidden = false;
  },

  showPreview() {
    if (!window.presentationData || !window.presentationData.slides) return;

    // Set header title
    const presTitle = document.getElementById('pres-title');
    if (presTitle) presTitle.textContent = window.presentationData.title || 'Presentation';

    this.renderSourceBadge(window.presentationData.source);

    // Reset to first slide
    const themeKey = window.presentationData.theme;
    SlidePreview.currentSlideIndex = 0;

    // Render main preview
    SlidePreview.renderSlide(window.presentationData.slides[0], themeKey, window.presentationData.design);

    // Render thumbnail strip
    SlidePreview.renderThumbnails(window.presentationData.slides, themeKey);

    // Update counter
    SlidePreview.updateCounter();

    // Load first slide into the editor
    if (window.SlideEditor) {
      SlideEditor.loadSlide(window.presentationData.slides[0]);
    }

    // Switch to preview view
    this.showView('preview');
  },

  /* ========================================================
   * Download PPT
   * ======================================================== */

  async handleDownload() {
    if (!window.presentationData) {
      this.showToast('No presentation data available.', 'error');
      return;
    }

    const btn = document.getElementById('download-btn');
    const originalHTML = btn ? btn.innerHTML : '';

    try {
      if (btn) {
        btn.innerHTML = '⏳ Generating PPT…';
        btn.disabled = true;
      }

      await PPTExport.exportPresentation(window.presentationData);
      this.showToast('Presentation downloaded successfully! 🎉', 'success');

    } catch (error) {
      this.showToast('Failed to generate PPT: ' + error.message, 'error');
      console.error('Export error:', error);
    } finally {
      if (btn) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    }
  },

  _resetSaveBtn() {
    if (this._saveWatchdog) { clearTimeout(this._saveWatchdog); this._saveWatchdog = null; }
    const btn = document.getElementById('save-edva-btn');
    if (btn && btn.dataset.original) { btn.innerHTML = btn.dataset.original; btn.disabled = false; delete btn.dataset.original; }
  },

  /* What the Save button says while a save is in progress. */
  _setSaveBtn(text) {
    const btn = document.getElementById('save-edva-btn');
    if (!btn) return;
    if (!btn.dataset.original) btn.dataset.original = btn.innerHTML;
    btn.textContent = '⏳ ' + text;
    btn.disabled = true;
  },

  // If the page never answers a save at all (it normally answers within
  // seconds, with success or an error), give the button back after this long.
  SAVE_WATCHDOG_MS: 5 * 60 * 1000,

  /* Build the .pptx and hand it to the EDVA parent panel to persist it
   * into the teacher's Course Content (via postMessage). */
  async handleSaveToEdva() {
    if (!window.presentationData) { this.showToast('No presentation data available.', 'error'); return; }
    if (window.parent === window) { this.showToast('Saving is only available inside the EDVA panel.', 'error'); return; }

    this._setSaveBtn('Preparing…');
    try {
      const { buffer, fileName } = await PPTExport.exportToFile(window.presentationData, (stage, done, total) => {
        this._setSaveBtn(stage === 'images' && total
          ? `Preparing slides… ${done}/${total}` : 'Building the file…');
      });

      // Build a markdown description from the slides so the viewer can render
      // math (KaTeX) and themed images properly when the saved PPT is opened.
      let markdownContent = '';
      const slides = (window.presentationData.slides || []);
      slides.forEach((slide, i) => {
        markdownContent += `## Slide ${i + 1}: ${slide.title || ''}\n`;
        if (slide.subtitle) markdownContent += `${slide.subtitle}\n`;
        (slide.bullets || []).forEach(b => { markdownContent += `- ${b}\n`; });
        if (slide.imageUrl) markdownContent += `![image](${slide.imageUrl})\n`;
        else if (slide.imageBase64) markdownContent += `![image](${slide.imageBase64})\n`;
        if (slide.imageSize) markdownContent += `<!-- SIZE: ${slide.imageSize} -->\n`;
        if (slide.imageFit) markdownContent += `<!-- FIT: ${slide.imageFit} -->\n`;
        if (slide.imagePosition) markdownContent += `<!-- POSITION: ${slide.imagePosition} -->\n`;
        markdownContent += '\n';
      });

      // The markdown alone reopens as V1 bullets; a V2 deck also carries
      // its full specification so the viewer can draw it as generated.
      const savedMarkdown = window.PPTV2Deck
        ? window.PPTV2Deck.embed(markdownContent.trim(), window.presentationData)
        : markdownContent.trim();

      // The file goes as bytes, handed over rather than copied (transferable).
      window.parent.postMessage({
        type: 'EDVA_PPT_SAVE',
        title: window.presentationData.title || 'Presentation',
        fileName,
        buffer,
        markdownContent: savedMarkdown,
      }, '*', [buffer]);
      this._setSaveBtn('Uploading…');
      // The button comes back when the page answers (saved, or why not). It
      // used to come back after 20s whatever happened - while a large file was
      // still uploading, inviting a second save of the same deck.
      if (this._saveWatchdog) clearTimeout(this._saveWatchdog);
      this._saveWatchdog = setTimeout(() => {
        this._saveWatchdog = null;
        this._resetSaveBtn();
        this.showToast('Saving is taking too long. Please check your connection and try again.', 'error');
      }, this.SAVE_WATCHDOG_MS);
    } catch (error) {
      this.showToast('Failed to prepare PPT: ' + error.message, 'error');
      this._resetSaveBtn();
    }
  },

  /* ========================================================
   * View Management
   * ======================================================== */

  /**
   * Switch between 'setup' and 'preview' views.
   * @param {'setup'|'preview'} view
   */
  showView(view) {
    this.currentView = view;

    const setupView   = document.getElementById('setup-view');
    const previewView = document.getElementById('preview-view');
    const appHeader   = document.querySelector('.app-header');

    if (setupView)   setupView.style.display   = view === 'setup'   ? 'block' : 'none';
    if (previewView) previewView.style.display  = view === 'preview' ? 'flex'  : 'none';
    if (appHeader)   appHeader.style.display    = view === 'setup'   ? ''      : 'none';
  },

  /* ========================================================
   * Loading Overlay
   * ======================================================== */

  /**
   * Show the full-screen loading overlay.
   * @param {string} status — Main status message
   * @param {string} step   — Sub-step text
   */
  /** Format an elapsed duration: 1 decimal under 10s, whole seconds beyond. */
  _fmtDuration(ms) {
    return ms >= 10000 ? Math.round(ms / 1000) + 's' : (ms / 1000).toFixed(1) + 's';
  },

  showLoading(status, step) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('visible');
    const scopeBox = document.getElementById('loading-scope');
    if (scopeBox) scopeBox.hidden = true;        // shown by _renderLoadingScope when generating
    this.renderActivity(null);
    this.updateLoadingStatus(status, step);
    this.updateProgress(0);

    // Live elapsed timer so teachers can see how long generation takes.
    this._loadStartAt = Date.now();
    const stepEl = document.getElementById('loading-step');
    let timerEl = document.getElementById('loading-timer');
    if (!timerEl && stepEl && stepEl.parentNode) {
      timerEl = document.createElement('div');
      timerEl.id = 'loading-timer';
      timerEl.style.cssText = 'margin-top:8px;font-size:12px;font-weight:700;color:#7c3aed;';
      stepEl.parentNode.insertBefore(timerEl, stepEl.nextSibling);
    }
    if (timerEl) timerEl.textContent = 'Elapsed: 0.0s';
    if (this._loadTimer) clearInterval(this._loadTimer);
    this._loadTimer = setInterval(() => {
      const el = document.getElementById('loading-timer');
      if (el) el.textContent = 'Elapsed: ' + this._fmtDuration(Date.now() - this._loadStartAt);
    }, 100);
  },

  /** Hide the loading overlay. */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('visible');
    const bgOffer = document.getElementById('loading-background');
    if (bgOffer) bgOffer.hidden = true;
    if (this._loadTimer) { clearInterval(this._loadTimer); this._loadTimer = null; }
  },

  /**
   * Update the loading status text.
   * @param {string} status
   * @param {string} step
   */
  updateLoadingStatus(status, step) {
    const statusEl = document.getElementById('loading-status');
    const stepEl   = document.getElementById('loading-step');
    if (statusEl) statusEl.textContent = status || '';
    if (stepEl)   stepEl.textContent   = step   || '';
  },

  /**
   * Update the loading progress bar width.
   * @param {number} percent — 0..100
   */
  updateProgress(percent) {
    const bar = document.getElementById('loading-progress');
    if (bar) bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
  },

  /* ========================================================
   * Toast Notifications
   * ======================================================== */

  /**
   * Show a transient toast message.
   * @param {string} message
   * @param {'success'|'error'|'info'} type
   */
  showToast(message, type) {
    type = type || 'info';

    const container = document.getElementById('toast-container');
    if (!container) {
      console.warn('Toast container not found');
      return;
    }

    const icons = {
      success: '✅',
      error:   '❌',
      info:    'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML =
      '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
      '<span class="toast-message">' + this._escapeHTML(message) + '</span>';

    container.appendChild(toast);

    // Trigger enter animation (allow the browser to paint first)
    requestAnimationFrame(() => {
      toast.classList.add('toast-enter');
    });

    // Auto-remove after 4 seconds
    const removeTimer = setTimeout(() => {
      toast.classList.add('toast-exit');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Fallback removal in case transitionend doesn't fire
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
    }, 4000);

    // Allow click to dismiss early
    toast.addEventListener('click', () => {
      clearTimeout(removeTimer);
      toast.classList.add('toast-exit');
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    });
  },

  /* ========================================================
   * Utility Helpers
   * ======================================================== */

  /**
   * Promise-based sleep.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Basic HTML entity escaping to prevent XSS in toast messages.
   * @param {string} str
   * @returns {string}
   */
  _escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

/* ----------------------------------------------------------
 * Bootstrap on DOM ready
 * ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
