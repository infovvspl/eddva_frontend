/* ============================================================
 * v2Deck.js — keep a V2 deck's design when it is saved
 * ============================================================
 * A saved PPT is reopened from its markdown description: the viewer parses
 * "## Slide N" headings and bullets back into slides. That round trip keeps
 * the words and drops everything V2 is made of (layout, theme, content
 * blocks, visual specification), so every saved V2 deck came back as a V1
 * bullets-and-photo deck.
 *
 * The fix rides inside the same description, so nothing on the server
 * changes: the full deck is appended as ONE html-comment line,
 *
 *   <!-- EDDVA_PPT_V2_DECK:<base64 of the deck JSON> -->
 *
 * which the markdown parser already skips (it ignores comment lines) and the
 * markdown renderer never interprets. Base64 rather than raw JSON because a
 * string inside the deck may itself contain "-->". The viewer prefers this
 * snapshot when it is present and falls back to the markdown when it is not,
 * so decks saved before this change open exactly as they did.
 *
 * Load order: after pptV2.js (uses PPTV2.isV2), before app.js.
 * ============================================================ */
(function () {
  var MARKER = 'EDDVA_PPT_V2_DECK';
  var PATTERN = /<!--\s*EDDVA_PPT_V2_DECK:([A-Za-z0-9+/=]+)\s*-->/;
  // The API accepts 10 MB request bodies; stay well inside it. A deck too big
  // to embed is still saved - it just reopens in the V1 layout, as before.
  var MAX_ENCODED_CHARS = 8 * 1024 * 1024;

  function isV2Slide(slide) {
    // An image slide (one painted picture) loses the same way through the
    // markdown round trip - the picture is not in it - so it rides along too.
    if (slide && slide.slideImage && slide.slideImage.url) return true;
    if (window.PPTV2 && typeof window.PPTV2.isV2 === 'function') return window.PPTV2.isV2(slide);
    return !!(slide && slide.v2 && slide.v2.layout && slide.v2.layout.regions && slide.v2.title);
  }

  function toBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var out = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(out);
  }

  function fromBase64(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /** The parts of a generated deck the viewer needs, nothing else. */
  function snapshot(deck) {
    var slides = (deck.slides || []).map(function (slide) {
      var copy = JSON.parse(JSON.stringify(slide));
      // The export pass inlines every image URL as base64 (imageBase64) so
      // pptxgenjs can embed it. The URL is enough to show it again, and the
      // inlined copy can be most of the payload.
      if (copy.imageUrl && copy.imageBase64 && String(copy.imageUrl).indexOf('data:') !== 0) {
        delete copy.imageBase64;
      }
      if (copy.slideImage && copy.slideImage.url && copy.slideImage.base64) {
        delete copy.slideImage.base64;
      }
      return copy;
    });
    var out = { title: deck.title || 'Presentation', slides: slides };
    if (deck.generation) out.generation = deck.generation;
    if (deck.source) out.source = deck.source;
    return out;
  }

  window.PPTV2Deck = {
    MARKER: MARKER,

    /** Does this deck contain at least one V2 slide? */
    hasV2(deck) {
      return !!(deck && Array.isArray(deck.slides) && deck.slides.some(isV2Slide));
    },

    /**
     * Return `markdown` with the V2 deck appended, or unchanged when the deck
     * has no V2 slide or is too big to embed.
     */
    embed(markdown, deck) {
      var md = String(markdown || '').replace(PATTERN, '').trim();
      if (!this.hasV2(deck)) return md;
      var encoded;
      try {
        encoded = toBase64(JSON.stringify(snapshot(deck)));
      } catch (err) {
        console.warn('V2 deck could not be serialised; saving the markdown only:', err);
        return md;
      }
      if (encoded.length > MAX_ENCODED_CHARS) {
        console.warn('V2 deck is ' + encoded.length + ' chars encoded; too big to embed, '
                     + 'it will reopen in the V1 layout.');
        return md;
      }
      return md + '\n\n<!-- ' + MARKER + ':' + encoded + ' -->';
    },

    /**
     * The V2 deck saved inside `markdown`, or null when there is none or it
     * cannot be read (the caller then falls back to parsing the markdown).
     */
    extract(markdown) {
      var m = PATTERN.exec(String(markdown || ''));
      if (!m) return null;
      try {
        var deck = JSON.parse(fromBase64(m[1]));
        return this.hasV2(deck) ? deck : null;
      } catch (err) {
        console.warn('Saved V2 deck is unreadable; showing the markdown version:', err);
        return null;
      }
    },
  };
})();
