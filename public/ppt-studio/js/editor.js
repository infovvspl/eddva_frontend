/* ============================================================
 * editor.js — Slide Editor Panel
 * ============================================================
 * Manages the sidebar edit panel for modifying slide content
 * in real-time: title, subtitle, bullets, images, and notes.
 *
 * Load order: 3rd (depends on: api.js, preview.js)
 * ============================================================ */

window.SlideEditor = {

  /** Debounce timer reference for auto-save */
  _saveTimer: null,

  /** Debounce delay in milliseconds */
  _saveDelay: 500,

  /* ----------------------------------------------------------
   * Initialization
   * ---------------------------------------------------------- */

  /**
   * Wire up all event listeners for the edit panel.
   * Called once from App.init().
   */
  init() {
    // ---- Contenteditable auto-save (title & subtitle) ------
    const editTitle    = document.getElementById('edit-title');
    const editSubtitle = document.getElementById('edit-subtitle');

    if (editTitle) {
      editTitle.addEventListener('input', () => this._debounceSave());
    }
    if (editSubtitle) {
      editSubtitle.addEventListener('input', () => this._debounceSave());
    }

    // ---- Speaker notes auto-save ---------------------------
    const editNotes = document.getElementById('edit-notes');
    if (editNotes) {
      editNotes.addEventListener('input', () => this._debounceSave());
    }

    // ---- Add bullet button ---------------------------------
    const addBulletBtn = document.getElementById('add-bullet-btn');
    if (addBulletBtn) {
      addBulletBtn.addEventListener('click', () => this.addBullet());
    }

    // ---- Regenerate slide button ---------------------------
    const regenBtn = document.getElementById('regenerate-btn');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => this.regenerateSlide());
    }

    // ---- Search new image button ---------------------------
    const searchBtn = document.getElementById('search-image-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchNewImage());
    }

    // Allow Enter in image search input to trigger search
    const searchInput = document.getElementById('edit-image-search');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.searchNewImage();
        }
      });
    }

    // ---- Image size selector --------------------------------
    const imageSizeSelect = document.getElementById('edit-image-size');
    if (imageSizeSelect) {
      imageSizeSelect.addEventListener('change', () => this._debounceSave());
    }

    // ---- Image crop / position picker -----------------------
    document.querySelectorAll('#edit-image-position .crop-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('#edit-image-position .crop-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this._debounceSave();
      });
    });

    // ---- Image fit toggle (Fill / Fit-whole-image) ----------
    document.querySelectorAll('#edit-image-fit .fit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#edit-image-fit .fit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.saveCurrentEdits();
      });
    });
  },

  /* ----------------------------------------------------------
   * Load slide data into the editor panel
   * ---------------------------------------------------------- */

  /**
   * Populate every field in the edit panel with the given slide's data.
   * @param {Object} slideData
   */
  loadSlide(slideData) {
    if (!slideData) return;

    // Title
    const editTitle = document.getElementById('edit-title');
    if (editTitle) editTitle.textContent = slideData.title || '';

    // Subtitle
    const editSubtitle = document.getElementById('edit-subtitle');
    if (editSubtitle) editSubtitle.textContent = slideData.subtitle || '';

    // Bullets
    this._renderBulletEditors(slideData.bullets || []);

    // Image preview
    const imgPreview = document.getElementById('edit-image-preview');
    const imgPlaceholder = document.getElementById('image-placeholder');
    if (imgPreview) {
      const imgSrc = slideData.imageBase64 || slideData.imageUrl || '';
      if (imgSrc) {
        imgPreview.src = imgSrc;
        imgPreview.style.display = 'block';
        if (imgPlaceholder) imgPlaceholder.style.display = 'none';
      } else {
        imgPreview.src = '';
        imgPreview.style.display = 'none';
        if (imgPlaceholder) imgPlaceholder.style.display = '';
      }
    }

    // Image search term
    const searchInput = document.getElementById('edit-image-search');
    if (searchInput) {
      searchInput.value = slideData.imageSearchTerm || '';
    }

    // Image size
    const imageSizeSelect = document.getElementById('edit-image-size');
    if (imageSizeSelect) {
      imageSizeSelect.value = slideData.imageSize || 'medium';
    }

    // Image crop / position
    const pos = slideData.imagePosition || 'center center';
    document.querySelectorAll('#edit-image-position .crop-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.pos === pos);
    });

    // Image fit
    const fit = slideData.imageFit || 'cover';
    document.querySelectorAll('#edit-image-fit .fit-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fit === fit);
    });

    // Speaker notes
    const editNotes = document.getElementById('edit-notes');
    if (editNotes) {
      editNotes.value = slideData.speakerNotes || '';
    }
  },

  /* ----------------------------------------------------------
   * Bullet point management
   * ---------------------------------------------------------- */

  /**
   * Build the list of editable bullet rows inside #edit-bullets.
   * @param {string[]} bullets
   */
  _renderBulletEditors(bullets) {
    const container = document.getElementById('edit-bullets');
    if (!container) return;

    container.innerHTML = '';

    bullets.forEach((text, idx) => {
      container.appendChild(this._createBulletRow(text, idx));
    });
  },

  /**
   * Create a single bullet editor row (contenteditable + delete btn).
   * @param {string} text  — Bullet text
   * @param {number} index — Bullet index
   * @returns {HTMLElement}
   */
  _createBulletRow(text, index) {
    const row = document.createElement('div');
    row.className = 'bullet-row';
    row.dataset.index = index;
    row.style.cssText = 'display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;';

    // Editable text
    const input = document.createElement('div');
    input.className = 'bullet-input';
    input.contentEditable = 'true';
    input.textContent = text;
    input.style.cssText = `
      flex:1;
      min-height:28px;
      padding:6px 8px;
      border:1px solid rgba(255,255,255,0.12);
      border-radius:6px;
      background:rgba(255,255,255,0.05);
      color:#e0e0e0;
      font-size:0.9em;
      outline:none;
      line-height:1.4;
      word-break:break-word;
    `;

    // Auto-save on input
    input.addEventListener('input', () => this._debounceSave());

    // Enter key → add new bullet below, Backspace on empty → remove
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const currentIdx = parseInt(row.dataset.index, 10);
        this._insertBulletAfter(currentIdx);
      }
      if (e.key === 'Backspace' && input.textContent.trim() === '') {
        e.preventDefault();
        const currentIdx = parseInt(row.dataset.index, 10);
        this.removeBullet(currentIdx);
      }
    });

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'bullet-delete-btn';
    delBtn.textContent = '✕';
    delBtn.title = 'Remove this bullet';
    delBtn.style.cssText = `
      width:24px; height:24px;
      border:none; border-radius:4px;
      background:rgba(233,69,96,0.2);
      color:#e94560;
      cursor:pointer;
      font-size:0.75em;
      flex-shrink:0;
      margin-top:4px;
      display:flex; align-items:center; justify-content:center;
      transition: background 0.2s;
    `;
    delBtn.addEventListener('mouseenter', () => { delBtn.style.background = 'rgba(233,69,96,0.4)'; });
    delBtn.addEventListener('mouseleave', () => { delBtn.style.background = 'rgba(233,69,96,0.2)'; });
    delBtn.addEventListener('click', () => {
      const currentIdx = parseInt(row.dataset.index, 10);
      this.removeBullet(currentIdx);
    });

    row.appendChild(input);
    row.appendChild(delBtn);
    return row;
  },

  /**
   * Add a new empty bullet at the end.
   */
  addBullet() {
    const container = document.getElementById('edit-bullets');
    if (!container) return;

    const newIndex = container.children.length;
    const row = this._createBulletRow('', newIndex);
    container.appendChild(row);

    // Focus the new input
    const input = row.querySelector('.bullet-input');
    if (input) input.focus();

    this._debounceSave();
  },

  /**
   * Insert a new bullet after the given index.
   * @param {number} afterIndex
   */
  _insertBulletAfter(afterIndex) {
    // Save current edits first (synchronous read)
    this.saveCurrentEdits();

    const slide = this._getCurrentSlide();
    if (!slide) return;

    // Insert empty string after the given index
    slide.bullets = slide.bullets || [];
    slide.bullets.splice(afterIndex + 1, 0, '');

    // Re-render bullets
    this._renderBulletEditors(slide.bullets);

    // Focus the newly inserted bullet
    const container = document.getElementById('edit-bullets');
    if (container) {
      const newRow = container.children[afterIndex + 1];
      if (newRow) {
        const input = newRow.querySelector('.bullet-input');
        if (input) input.focus();
      }
    }

    this._refreshPreview();
  },

  /**
   * Remove a bullet by index.
   * @param {number} index
   */
  removeBullet(index) {
    const slide = this._getCurrentSlide();
    if (!slide) return;

    slide.bullets = slide.bullets || [];
    if (index < 0 || index >= slide.bullets.length) return;

    slide.bullets.splice(index, 1);
    this._renderBulletEditors(slide.bullets);
    this._refreshPreview();
  },

  /* ----------------------------------------------------------
   * Save edits → data model
   * ---------------------------------------------------------- */

  /**
   * Read all values from the edit panel and update the current
   * slide in window.presentationData.
   */
  saveCurrentEdits() {
    const slide = this._getCurrentSlide();
    if (!slide) return;

    // Title
    const editTitle = document.getElementById('edit-title');
    if (editTitle) slide.title = editTitle.textContent.trim();

    // Subtitle
    const editSubtitle = document.getElementById('edit-subtitle');
    if (editSubtitle) slide.subtitle = editSubtitle.textContent.trim();

    // Bullets
    const bulletInputs = document.querySelectorAll('#edit-bullets .bullet-input');
    slide.bullets = Array.from(bulletInputs).map(el => el.textContent.trim());

    // Image size
    const imageSizeSelect = document.getElementById('edit-image-size');
    if (imageSizeSelect) slide.imageSize = imageSizeSelect.value;

    // Image crop / position
    const activeDot = document.querySelector('#edit-image-position .crop-dot.active');
    slide.imagePosition = activeDot ? activeDot.dataset.pos : 'center center';

    // Image fit (cover = fill/crop, contain = show whole image)
    const activeFit = document.querySelector('#edit-image-fit .fit-btn.active');
    slide.imageFit = activeFit ? activeFit.dataset.fit : 'cover';

    // Speaker notes
    const editNotes = document.getElementById('edit-notes');
    if (editNotes) slide.speakerNotes = editNotes.value;

    // Re-render preview
    this._refreshPreview();
  },

  /* ----------------------------------------------------------
   * Regenerate slide
   * ---------------------------------------------------------- */

  /**
   * Regenerate the current slide's content via the API and refresh.
   */
  async regenerateSlide() {
    const slide = this._getCurrentSlide();
    if (!slide || !window.presentationData) return;

    const btn = document.getElementById('regenerate-btn');
    const originalHTML = btn ? btn.innerHTML : '';

    try {
      // Show loading state
      if (btn) {
        btn.innerHTML = '⏳ Regenerating…';
        btn.disabled = true;
      }

      const newSlide = await window.API.regenerateSlide(
        window.SlidePreview.currentSlideIndex,
        window.presentationData.title,
        slide,
        window.presentationData.slides.length
      );

      // Merge new data into the existing slide (preserve position info)
      const idx = window.SlidePreview.currentSlideIndex;
      window.presentationData.slides[idx] = {
        ...window.presentationData.slides[idx],
        ...newSlide,
        slideNumber: idx + 1
      };

      // Refresh editor and preview
      this.loadSlide(window.presentationData.slides[idx]);
      this._refreshPreview();
      window.SlidePreview.renderThumbnails(
        window.presentationData.slides,
        window.presentationData.theme
      );

      if (window.App) window.App.showToast('Slide regenerated successfully!', 'success');
    } catch (error) {
      console.error('Regenerate error:', error);
      if (window.App) window.App.showToast('Failed to regenerate: ' + error.message, 'error');
    } finally {
      if (btn) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    }
  },

  /* ----------------------------------------------------------
   * Search new image
   * ---------------------------------------------------------- */

  /**
   * Search for a new image and update the current slide.
   */
  async searchNewImage() {
    const searchInput = document.getElementById('edit-image-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (!searchTerm) {
      if (window.App) window.App.showToast('Please enter an image search term.', 'error');
      return;
    }

    const btn = document.getElementById('search-image-btn');
    const originalHTML = btn ? btn.innerHTML : '';

    try {
      if (btn) {
        btn.innerHTML = '⏳ Searching…';
        btn.disabled = true;
      }

      const result = await window.API.searchImage(searchTerm);

      // Update slide data
      const slide = this._getCurrentSlide();
      if (slide) {
        slide.imageUrl = result.imageUrl || '';
        slide.imageBase64 = result.imageBase64 || '';
        slide.imageSearchTerm = searchTerm;
      }

      // Update image preview in editor
      const imgPreview = document.getElementById('edit-image-preview');
      const imgPlaceholder = document.getElementById('image-placeholder');
      if (imgPreview) {
        const newSrc = result.imageBase64 || result.imageUrl || '';
        if (newSrc) {
          imgPreview.src = newSrc;
          imgPreview.style.display = 'block';
          if (imgPlaceholder) imgPlaceholder.style.display = 'none';
        } else {
          imgPreview.style.display = 'none';
          if (imgPlaceholder) imgPlaceholder.style.display = '';
        }
      }

      // Refresh preview and thumbnails
      this._refreshPreview();
      window.SlidePreview.renderThumbnails(
        window.presentationData.slides,
        window.presentationData.theme
      );

      if (window.App) window.App.showToast('Image updated!', 'success');
    } catch (error) {
      console.error('Image search error:', error);
      if (window.App) window.App.showToast('Image search failed: ' + error.message, 'error');
    } finally {
      if (btn) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      }
    }
  },

  /* ----------------------------------------------------------
   * Internal helpers
   * ---------------------------------------------------------- */

  /**
   * Get the currently selected slide object.
   * @returns {Object|null}
   */
  _getCurrentSlide() {
    if (!window.presentationData || !window.presentationData.slides) return null;
    const idx = window.SlidePreview.currentSlideIndex;
    return window.presentationData.slides[idx] || null;
  },

  /**
   * Re-render the main slide preview for the current slide.
   */
  _refreshPreview() {
    if (!window.presentationData) return;
    const idx = window.SlidePreview.currentSlideIndex;
    const slide = window.presentationData.slides[idx];
    if (slide) {
      window.SlidePreview.renderSlide(slide, window.presentationData.theme);
    }
  },

  /**
   * Debounced auto-save — waits _saveDelay ms after last input.
   */
  _debounceSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this.saveCurrentEdits();
    }, this._saveDelay);
  }
};
