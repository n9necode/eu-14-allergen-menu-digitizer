'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Detect whether poppler-utils `pdftoppm` is available on PATH.
 */
function hasPdftoppm() {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Render PDF pages to PNG buffers (150 dpi). Returns [{buffer, mime, page}].
 * Falls back gracefully when pdftoppm is missing (caller sends the whole PDF to Gemini).
 */
async function renderPdfPages(buffer, maxPages) {
  if (!hasPdftoppm()) return [];

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'menu-digitizer-pdf-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');
  const outPrefix = path.join(tmpDir, 'page');
  fs.writeFileSync(pdfPath, buffer);

  try {
    execFileSync('pdftoppm', ['-png', '-r', '150', '-f', '1', '-l', String(maxPages), pdfPath, outPrefix], {
      stdio: 'ignore',
      timeout: 300000
    });
    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('page-') && f.endsWith('.png')).sort();
    return files.map((f, i) => ({
      buffer: fs.readFileSync(path.join(tmpDir, f)),
      mime: 'image/png',
      page: i + 1
    }));
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }
}

module.exports = { hasPdftoppm, renderPdfPages };