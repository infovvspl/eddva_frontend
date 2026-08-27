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

          const parsedSlides = this.parseMarkdownToSlides(markdown);
          window.presentationData = {
            title,
            slides: parsedSlides,
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
        if (topicInput) topicInput.value = topic;
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
      const slides = parseInt(params.get('slides') || '', 10);
      if (Number.isFinite(slides)) {
        const slider = document.getElementById('slide-count-slider');
        const display = document.getElementById('slide-count-display');
        if (slider) { slider.value = String(slides); if (display) display.textContent = String(slides); }
      }
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
    const el = document.getElementById('scope-banner');
    if (!el) return;
    const s = this.scope || {};
    const parts = [s.className, s.subjectName, s.chapterName, s.topicName].filter(Boolean);
    if (!parts.length) {
      el.hidden = true;
      return;
    }
    const scopeKind = s.topicName
      ? 'this topic only'
      : s.chapterName
        ? 'this whole chapter'
        : 'this subject';
    el.hidden = false;

    // Without a class the AI has no grade to pitch at and will guess, which is
    // how a Class 10 topic ends up with college-level slides. Say so up front
    // rather than letting the teacher discover it in the generated deck.
    const missingClass = !s.className;
    el.classList.toggle('scope-banner--warn', missingClass);
    el.innerHTML =
      '<strong>Curriculum scope:</strong> ' +
      parts.map((p) => this._escape(p)).join(' &rsaquo; ') +
      ' <span class="scope-kind">— slides will cover ' + scopeKind + '</span>' +
      (missingClass
        ? '<div class="scope-warn">⚠ No class detected for this subject, so slides may not be '
          + 'pitched at the right grade. Open this from a class in Topic Management, or check '
          + 'the subject is linked to a class.</div>'
        : '');
  },

  _escape(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
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
      if (t === 'EDVA_PPT_SAVED') this.showToast('Saved to Course Content ✅', 'success');
      else if (t === 'EDVA_PPT_SAVE_ERROR') this.showToast('Save failed: ' + (e.data.message || 'try again'), 'error');
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

  initSliderSync() {
    const slider  = document.getElementById('slide-count-slider');
    const display = document.getElementById('slide-count-display');
    if (!slider || !display) return;

    // Set initial display value
    display.textContent = slider.value;

    slider.addEventListener('input', () => {
      display.textContent = slider.value;
    });
  },

  /* ========================================================
   * Theme Picker
   * ======================================================== */

  initThemePicker() {
    const cards = document.querySelectorAll('.theme-card');
    if (!cards.length) return;

    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });

    const anySelected = document.querySelector('.theme-card.selected');
    if (!anySelected && cards.length > 0) cards[0].classList.add('selected');
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

  async handleGenerate() {
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

    const slideCount = parseInt(document.getElementById('slide-count-slider').value, 10) || 8;
    const theme      = document.querySelector('.theme-card.selected')?.dataset.theme || 'dark-professional';
    const design     = document.querySelector('.style-card.selected')?.dataset.style || 'executive';
    const language   = document.getElementById('language-select').value || 'en';

    // ---- Show loading overlay -------------------------------
    this.showLoading(
      'Generating your presentation…',
      'Step 1 of 3: Creating AI content…'
    );
    this.updateProgress(10);

    try {
      // Step 1 — Content generation
      this.updateLoadingStatus(
        'Generating content with AI…',
        'Step 1 of 3: Creating slide content…'
      );
      this.updateProgress(20);

      const result = await API.generatePresentation(topic, slideCount, theme, language, this.scope);

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
      if (took != null) {
        this.showToast('Presentation generated in ' + this._fmtDuration(took), 'success');
      }

    } catch (error) {
      this.hideLoading();
      this.showToast(error.message || 'Failed to generate presentation. Please try again.', 'error');
      console.error('Generation error:', error);
    }
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
      el.className = 'source-badge source-badge--grounded';
      el.innerHTML = '<span class="badge-dot"></span>From your textbook' + range;
      el.title = 'Every slide was written from the chapter PDF uploaded for this class.';
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
    const btn = document.getElementById('save-edva-btn');
    if (btn && btn.dataset.original) { btn.innerHTML = btn.dataset.original; btn.disabled = false; delete btn.dataset.original; }
  },

  /* Build the .pptx and hand it to the EDVA parent panel to persist it
   * into the teacher's Course Content (via postMessage). */
  async handleSaveToEdva() {
    if (!window.presentationData) { this.showToast('No presentation data available.', 'error'); return; }
    if (window.parent === window) { this.showToast('Saving is only available inside the EDVA panel.', 'error'); return; }

    const btn = document.getElementById('save-edva-btn');
    if (btn) { btn.dataset.original = btn.innerHTML; btn.innerHTML = '⏳ Saving…'; btn.disabled = true; }
    try {
      const { base64, fileName } = await PPTExport.exportToBase64(window.presentationData);

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

      window.parent.postMessage({
        type: 'EDVA_PPT_SAVE',
        title: window.presentationData.title || 'Presentation',
        fileName,
        base64,
        markdownContent: markdownContent.trim(),
      }, '*');
      this.showToast('Saving to Course Content…', 'info');
      // Safety: re-enable the button if the parent never acks.
      setTimeout(() => this._resetSaveBtn(), 20000);
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
