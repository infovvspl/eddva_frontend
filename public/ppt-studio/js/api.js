/* ============================================================
 * api.js — Backend Communication Layer (EDVA-native)
 * ============================================================
 * Talks to the EDVA NestJS API (/school/ppt/*) instead of a
 * standalone server. Config is passed in via query params by the
 * embedding EDVA panel:
 *   ?api=<apiBase>&institute=<instituteId>&topic=...
 * The auth token is read from localStorage (same origin as EDVA).
 *
 * Load order: 1st (no dependencies)
 * ============================================================ */

/* Resolve config once. Exposed on window so preview.js can build proxy URLs. */
window.PPT_CFG = (function () {
  var p = new URLSearchParams(window.location.search);
  var base = (p.get('api') || '').trim();
  if (!base) base = '/api/v1';                 // same-origin fallback (reverse-proxied)
  base = base.replace(/\/$/, '');
  var token = '';
  try { token = localStorage.getItem('eddva_access_token') || ''; } catch (_e) {}
  var host = (window.location.hostname || '').split('.')[0] || '';
  return {
    base: base,
    institute: (p.get('institute') || '').trim(),
    // The EDVA page this studio is open in (path + query), recorded with a deck
    // so Course Content can open it there later; and a deck to resume.
    page: (p.get('page') || '').trim(),
    job: (p.get('job') || '').trim(),
    token: token,
    host: host,
    pptUrl: function (path) { return base + '/school/ppt' + path; },
    proxyUrl: function (url) { return base + '/school/ppt/proxy-image?url=' + encodeURIComponent(url); },
    materialImageUrl: function (id, slideIndex) { return base + '/school/ppt/material/' + id + '/image/' + slideIndex; },
  };
})();

function pptHeaders() {
  var h = { 'Content-Type': 'application/json' };
  if (window.PPT_CFG.token) h['Authorization'] = 'Bearer ' + window.PPT_CFG.token;
  if (window.PPT_CFG.institute) h['X-Institute-Id'] = window.PPT_CFG.institute;
  if (window.PPT_CFG.host) h['X-Institute-Domain'] = window.PPT_CFG.host;
  return h;
}

/** Drop empty scope fields so the server sees an absent key, not an empty string. */
function scopeFields(scope) {
  var out = {};
  if (!scope) return out;
  ['classId', 'subjectId', 'chapterId', 'topicId',
   'className', 'subjectName', 'chapterName', 'topicName'].forEach(function (k) {
    if (scope[k]) out[k] = scope[k];
  });
  return out;
}

/** The studio theme for V2 and image decks. "Match the subject" is the
 *  server's default, so it is sent as no theme at all. */
function deckThemeField(deckTheme) {
  return deckTheme && deckTheme !== 'subject' ? { deckTheme: deckTheme } : {};
}

window.API = {

  /** What can this deck's scope be generated from right now (before generating). */
  async getSourceAvailability(scope) {
    try {
      const params = new URLSearchParams(scopeFields(scope));
      const response = await fetch(window.PPT_CFG.pptUrl('/source-availability?' + params.toString()), {
        method: 'GET',
        headers: pptHeaders(),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.success !== false ? data.data : null;
    } catch (_e) {
      return null; // best-effort — the source selector just stays hidden
    }
  },

  async generatePresentation(topic, slideCount, theme, language, scope, sourceMode, pptVersion, deckTheme) {
    try {
      const response = await fetch(window.PPT_CFG.pptUrl('/generate'), {
        method: 'POST',
        headers: pptHeaders(),
        body: JSON.stringify({
          topic, slideCount, theme, language, sourceMode, ...scopeFields(scope),
          ...(pptVersion ? { pptVersion } : {}),
          ...deckThemeField(deckTheme),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && (errorData.message || errorData.error)) || `Server responded with status ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed to generate presentation');
      return data.data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your connection and try again.');
      }
      throw error;
    }
  },

  /**
   * Start a deck in the background. Resolves to the job id, or null when this
   * backend has no job route yet (an older deployment) - the caller then uses
   * the one-request generatePresentation instead.
   */
  /* options.fresh: make a new deck even when an identical one was made before
   * (the AI service otherwise returns the kept one at once). */
  // Pauses before the retries of a start that never reached the server.
  START_RETRY_WAITS_MS: [1500, 3000],

  async startPresentation(topic, slideCount, theme, language, scope, sourceMode, pptVersion, deckTheme,
                          options = {}) {
    const body = JSON.stringify({
      topic, slideCount, theme, language, sourceMode, ...scopeFields(scope),
      ...(pptVersion ? { pptVersion } : {}),
      ...deckThemeField(deckTheme),
      ...(options && options.fresh ? { fresh: true } : {}),
      ...(window.PPT_CFG.page ? { pagePath: window.PPT_CFG.page } : {}),
    });
    // A blip on the way (no connection, a proxy saying 502/503) is retried: the
    // request most likely never reached the server, so no deck was started.
    // Anything else - a real answer, or a 504 that may have started one - is not,
    // so a deck is never started twice.
    const waits = this.START_RETRY_WAITS_MS || [];
    let response;
    for (let attempt = 0; ; attempt++) {
      try {
        response = await fetch(window.PPT_CFG.pptUrl('/generate/start'), {
          method: 'POST', headers: pptHeaders(), body,
        });
        if ((response.status === 502 || response.status === 503) && attempt < waits.length) {
          await new Promise((r) => setTimeout(r, waits[attempt]));
          continue;
        }
        break;
      } catch (err) {
        if (attempt >= waits.length) throw new Error('Could not reach the server. Please check your connection and try again.');
        await new Promise((r) => setTimeout(r, waits[attempt]));
      }
    }
    if (response.status === 404) return null;
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error((errorData && (errorData.message || errorData.error))
        || `Server responded with status ${response.status}`);
    }
    const data = await response.json();
    return data.jobId || (data.data && data.data.jobId) || null;
  },

  /** Take a deck off the teacher's "in the background" list (it has been opened). */
  async dismissJob(jobId) {
    try {
      await fetch(window.PPT_CFG.pptUrl('/jobs/' + encodeURIComponent(jobId) + '/dismiss'), {
        method: 'POST', headers: pptHeaders(),
      });
    } catch (_e) { /* the list entry simply expires */ }
  },

  /** A background deck: { status, stage, done, total, partial, result, error }. */
  async getPresentationStatus(jobId) {
    const response = await fetch(window.PPT_CFG.pptUrl('/generate/status/' + encodeURIComponent(jobId)), {
      method: 'GET',
      headers: pptHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const err = new Error((errorData && (errorData.message || errorData.error))
        || `Server responded with status ${response.status}`);
      err.status = response.status;   // a 404 is a deck that is gone; the rest may pass
      throw err;
    }
    const data = await response.json();
    return data && data.status ? data : (data.data || data);
  },

  async regenerateSlide(slideIndex, topic, currentSlide, totalSlides, scope) {
    try {
      const { imageBase64: _b64, imageUrl: _url, ...slideContext } = currentSlide;
      const response = await fetch(window.PPT_CFG.pptUrl('/regenerate-slide'), {
        method: 'POST',
        headers: pptHeaders(),
        body: JSON.stringify({
          slideIndex, topic, currentSlide: slideContext, totalSlides, ...scopeFields(scope),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && (errorData.message || errorData.error)) || `Failed to regenerate slide (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed to regenerate slide content');
      return data.data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your connection.');
      }
      throw error;
    }
  },

  async searchImage(searchTerm) {
    if (!searchTerm || !searchTerm.trim()) throw new Error('Please enter a search term for the image.');
    try {
      const response = await fetch(window.PPT_CFG.pptUrl('/search-image'), {
        method: 'POST',
        headers: pptHeaders(),
        body: JSON.stringify({ searchTerm: searchTerm.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error((errorData && (errorData.message || errorData.error)) || `Image search failed (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.message || data.error || 'Image search returned no results');
      return { imageUrl: data.imageUrl || '', imageBase64: data.imageBase64 || '' };
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to the server. Please check your connection.');
      }
      throw error;
    }
  },
};
