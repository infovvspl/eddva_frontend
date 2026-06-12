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

    // Ensure we start on the setup view
    this.showView('setup');

    // Prefill from URL (used when embedded in the EDVA teacher panel):
    //   ?topic=Photosynthesis&slides=8&lang=en&auto=1
    this.applyUrlPrefill();
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

      const result = await API.generatePresentation(topic, slideCount, theme, language);

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

      this.hideLoading();
      this.showPreview();

    } catch (error) {
      this.hideLoading();
      this.showToast(error.message || 'Failed to generate presentation. Please try again.', 'error');
      console.error('Generation error:', error);
    }
  },

  /* ========================================================
   * Show Preview
   * ======================================================== */

  showPreview() {
    if (!window.presentationData || !window.presentationData.slides) return;

    // Set header title
    const presTitle = document.getElementById('pres-title');
    if (presTitle) presTitle.textContent = window.presentationData.title || 'Presentation';

    // Reset to first slide
    const themeKey = window.presentationData.theme;
    SlidePreview.currentSlideIndex = 0;

    // Render main preview
    SlidePreview.renderSlide(window.presentationData.slides[0], themeKey);

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
      window.parent.postMessage({
        type: 'EDVA_PPT_SAVE',
        title: window.presentationData.title || 'Presentation',
        fileName,
        base64,
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
  showLoading(status, step) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('visible');
    this.updateLoadingStatus(status, step);
    this.updateProgress(0);
  },

  /** Hide the loading overlay. */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('visible');
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
