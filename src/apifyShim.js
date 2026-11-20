'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DATASET_DIR = path.join(process.cwd(), '.dataset');
const RECORDS_FILE = path.join(DATASET_DIR, 'records.jsonl');
const OUTPUT_FILE = path.join(process.cwd(), 'OUTPUT.json');

function ensureDatasetDir() {
  if (!fs.existsSync(DATASET_DIR)) fs.mkdirSync(DATASET_DIR, { recursive: true });
}

function readLocalInput() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'INPUT.json'), 'utf8'));
  } catch (e) {
    return null;
  }
}

async function getValue(key) {
  if (key === 'INPUT') return readLocalInput();
  return null;
}

async function pushData(record) {
  ensureDatasetDir();
  fs.appendFileSync(RECORDS_FILE, JSON.stringify(record) + '\n');
  return record;
}

async function main(fn) {
  ensureDatasetDir();
  if (fs.existsSync(RECORDS_FILE)) fs.rmSync(RECORDS_FILE);
  try {
    await fn();
  } finally {
    const records = [];
    if (fs.existsSync(RECORDS_FILE)) {
      for (const line of fs.readFileSync(RECORDS_FILE, 'utf8').split('\n')) {
        if (line.trim()) records.push(JSON.parse(line));
      }
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2));
    console.log(`[apify-shim] Wrote ${records.length} records to ${OUTPUT_FILE}`);
  }
}

async function openDataset(name) {
  return {
    pushData: async (record) => {
      ensureDatasetDir();
      fs.appendFileSync(path.join(DATASET_DIR, `${name}.jsonl`), JSON.stringify(record) + '\n');
      return record;
    }
  };
}

module.exports = { Apify: { getValue, pushData, main, openDataset }, readLocalInput };