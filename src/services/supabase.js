// ---------------------------------------------------------------------------
// supabase.js
// Booth → Supabase lead capture, two-phase write keyed by scan_id.
//
// Why two phases:
//   Marketing wants the conversion funnel, not just the bottom. Visitors who
//   scan but walk away before claiming the workout still produce a row with
//   gender / goal / demographics — name / email / phone stay NULL. Whoever
//   makes it through to the lead form upserts onto the same row.
//
//   Phase 1 (submitInitialScan)  — fires from BoothLanding.pickGoal at the
//                                  moment the visitor commits to scanning.
//                                  Captures: scan_id, gender, goal, optional
//                                  age/height/weight bands, source, captured_at.
//   Phase 2 (finaliseLead)       — fires from LeadCapture on form submit.
//                                  Upserts the same scan_id row with: name,
//                                  email, phone, marketing_opt_in, body_type,
//                                  frame_size.
//
// Both writes are PostgREST upserts (`Prefer: resolution=merge-duplicates`,
// `?on_conflict=scan_id`). That way, if phase 1's network call dies but
// phase 2 lands, the row is still created with all known fields. We never
// lose conversions to a dropped initial fetch.
//
// We don't use @supabase/supabase-js — for two REST calls + a queue helper
// it would add ~50KB gzipped for nothing we'd use.
//
// Anon key is shipped in the public bundle. RLS is the security boundary:
//   • INSERT  → anon, no restriction
//   • UPDATE  → anon, only rows where name IS NULL AND captured_at within
//               the last 10 minutes (i.e. unfinalised + fresh)
//   • SELECT  → not granted to anon
// See supabase/bootstrap.sql for the policy SQL.
//
// Resilience:
//   • Phase 1 is fire-and-forget. If it fails we just log; phase 2's upsert
//     will create the row from scratch.
//   • Phase 2 queues the payload to localStorage before the network call. On
//     each phase-2 attempt we try to flush the entire queue in one batch —
//     if a kiosk runs offline all day, the next online visitor's submission
//     drains everyone's records.
// ---------------------------------------------------------------------------

import { STORAGE_KEYS } from '../utils/constants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE = 'leads';
const STORAGE_KEY = STORAGE_KEYS.LEADS;

/** True when both env vars are populated. False = silent no-op everywhere. */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Generate a fresh scan_id. v4 UUID via crypto.randomUUID() — 122 bits of
 * entropy, unguessable. Acts as a one-time bearer token for the row's brief
 * unfinalised window: anyone who knows the UUID can update the row, but
 * only while name IS NULL and the row is < 10 minutes old (RLS-enforced).
 */
export function newScanId() {
  // crypto.randomUUID is available in every browser the booth supports
  // (deployed via Vite, modern targets only). Fallback for paranoia.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // RFC4122-ish fallback. Never expected to run, but better than throwing
  // if a niche browser ships without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * POST a batch of upsert payloads. Throws on non-2xx.
 */
async function upsertLeads(rows) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase env vars missing — set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }
  // on_conflict=scan_id + Prefer: resolution=merge-duplicates → INSERT new
  // rows, MERGE onto existing rows that share scan_id. Single round-trip
  // either way.
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=scan_id`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      // Don't echo the rows back — saves bandwidth and avoids needing a
      // SELECT policy on the anon role.
      Prefer: 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase upsert ${res.status}: ${errText.slice(0, 240)}`);
  }
}

// ============================== PHASE 1 ===================================

/**
 * Phase 1: fire-and-forget INSERT at scan-start. Captures everything known
 * on the landing page — gender, goal, optional demographic bands.
 *
 * Failures are logged but never block the booth flow. If this drops, phase
 * 2's upsert creates the row from scratch with whatever it has.
 */
export async function submitInitialScan({ scanId, gender, goal, ageRange, heightRange, weightRange }) {
  if (!isSupabaseConfigured() || !scanId) return;
  const payload = {
    scan_id: scanId,
    gender: gender || null,
    goal: goal || null,
    age_range: ageRange || null,
    height_range: heightRange || null,
    weight_range: weightRange || null,
    source: 'booth-fitscan',
    captured_at: new Date().toISOString(),
  };
  try {
    await upsertLeads([payload]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Initial scan write failed (phase 2 will compensate):', err);
  }
}

// ============================== PHASE 2 ===================================
// Queue helpers for the form-submit upsert. Phase 2 is the high-stakes one
// (it's where contact info lands), so we back it with localStorage.

function readQueue() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Could not persist lead queue:', err);
  }
}

/**
 * Phase 2: form submit. Queues the upsert payload locally and attempts to
 * flush the entire queue in one transactional batch. On success the queue
 * clears; on failure it's retained for the next visitor to retry.
 *
 * Payload shape — only fields that change at form-submit time. The phase-1
 * write has already populated gender/goal/demographics on the same scan_id
 * row, so the upsert's MERGE leaves those alone.
 */
export async function finaliseLead({ scanId, name, email, phone, marketingOptIn, bodyType, frameSize, goal, gender, ageRange, heightRange, weightRange }) {
  // Defensive: include landing-page fields too, so the upsert creates a
  // complete row even if phase 1 dropped. Merge semantics + same scan_id
  // means no duplicate row when both phases ran.
  const payload = {
    scan_id: scanId,
    name: name || null,
    email: email || null,
    phone: phone || null,
    marketing_opt_in: Boolean(marketingOptIn),
    body_type: bodyType || null,
    frame_size: frameSize || null,
    goal: goal || null,
    gender: gender || null,
    age_range: ageRange || null,
    height_range: heightRange || null,
    weight_range: weightRange || null,
    source: 'booth-fitscan',
    captured_at: new Date().toISOString(),
  };

  // Queue first — never lose a submission to a flaky network.
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);

  // Try to flush the whole queue (this submission + anything backed up).
  if (!isSupabaseConfigured()) return 0;
  try {
    await upsertLeads(queue);
    writeQueue([]);
    return queue.length;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Lead flush failed (queue retained for retry):', err);
    return 0;
  }
}

/**
 * Operator escape-hatch: returns the current queue without modifying it.
 * Useful in devtools (`peekQueuedLeads()`) for triaging a stuck queue.
 */
export function peekQueuedLeads() {
  return readQueue();
}
