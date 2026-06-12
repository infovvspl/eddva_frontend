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
    token: token,
    host: host,
    pptUrl: function (path) { return base + '/school/ppt' + path; },
    proxyUrl: function (url) { return base + '/school/ppt/proxy-image?url=' + encodeURIComponent(url); },
  };
})();

function pptHeaders() {
  var h = { 'Content-Type': 'application/json' };
  if (window.PPT_CFG.token) h['Authorization'] = 'Bearer ' + window.PPT_CFG.token;
  if (window.PPT_CFG.institute) h['X-Institute-Id'] = window.PPT_CFG.institute;
  if (window.PPT_CFG.host) h['X-Institute-Domain'] = window.PPT_CFG.host;
  return h;
}

window.API = {

  async generatePresentation(topic, slideCount, theme, language) {
    try {
      const response = await fetch(window.PPT_CFG.pptUrl('/generate'), {
        method: 'POST',
        headers: pptHeaders(),
        body: JSON.stringify({ topic, slideCount, theme, language }),
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

  async regenerateSlide(slideIndex, topic, currentSlide, totalSlides) {
    try {
      const { imageBase64: _b64, imageUrl: _url, ...slideContext } = currentSlide;
      const response = await fetch(window.PPT_CFG.pptUrl('/regenerate-slide'), {
        method: 'POST',
        headers: pptHeaders(),
        body: JSON.stringify({ slideIndex, topic, currentSlide: slideContext, totalSlides }),
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
