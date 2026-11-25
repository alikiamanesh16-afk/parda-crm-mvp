// ─── App configuration ────────────────────────────────────────────────────────
// DATA_SOURCE decides where data comes from:
//   'csv' → local CSV file (MVP phase 1)
//   'api' → remote API   (phase 2 — switch here only, nothing else changes)
export const DATA_SOURCE: 'csv' | 'api' = 'csv';

// Path of the CSV served by Vite (put the file in /public)
export const CSV_URL = '/parda_crm.csv';

// Base URL of the future API (used only when DATA_SOURCE === 'api')
export const API_BASE_URL = ''; // e.g. 'https://api.parda.example/v1'
