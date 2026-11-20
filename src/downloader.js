'use strict';

/**
 * Download a file from a URL to a Buffer using Node 18+ global fetch.
 * Aborts after 120s and rejects payloads larger than 25MB.
 */
const MAX_BYTES = 25 * 1024 * 1024;

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop() || '';
    const dot = base.lastIndexOf('.');
    return dot >= 0 ? base.slice(dot).toLowerCase() : '';
  } catch (e) {
    return '';
  }
}

async function downloadFile(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);

  let res;
  try {
    res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }

  const contentType = res.headers.get('content-type') || '';
  const contentLength = Number(res.headers.get('content-length') || '-1');
  if (contentLength > 0 && contentLength > MAX_BYTES) {
    throw new Error(`File too large: ${contentLength} bytes (max ${MAX_BYTES})`);
  }

  const chunks = [];
  let total = 0;
  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) throw new Error(`Stream too large (max ${MAX_BYTES} bytes)`);
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks, total);
  const ext = extensionFromUrl(url);
  let mime = contentType.split(';')[0].trim().toLowerCase();
  if (!mime || mime === 'application/octet-stream') {
    if (ext === '.pdf') mime = 'application/pdf';
    else if (['.jpg', '.jpeg'].includes(ext)) mime = 'image/jpeg';
    else if (ext === '.png') mime = 'image/png';
    else if (ext === '.webp') mime = 'image/webp';
  }
  return { buffer, mime, ext, url };
}

module.exports = { downloadFile, MAX_BYTES, extensionFromUrl };