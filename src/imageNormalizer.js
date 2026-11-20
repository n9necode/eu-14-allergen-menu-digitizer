'use strict';

/**
 * Optional image normalization via jimp: cap the longest edge at 1600px and
 * re-encode as JPEG (quality 85) to keep Gemini payloads small. If jimp is
 * unavailable or anything fails, the original buffer is returned unchanged.
 */
let jimp;
try { jimp = require('jimp'); } catch (e) { jimp = null; }

const MAX_EDGE = 1600;

async function normalizeImage(buffer, mime) {
  if (!jimp) return { buffer, mime };

  try {
    const image = await jimp.read(buffer);
    const w = image.getWidth();
    const h = image.getHeight();
    const edge = Math.max(w, h);
    if (edge > MAX_EDGE) {
      const scale = MAX_EDGE / edge;
      image.scale(scale);
    }
    const out = await image.quality(85).getBufferAsync('image/jpeg');
    return { buffer: Buffer.from(out), mime: 'image/jpeg' };
  } catch (e) {
    return { buffer, mime };
  }
}

module.exports = { normalizeImage, MAX_EDGE };