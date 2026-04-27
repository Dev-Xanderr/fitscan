// ---------------------------------------------------------------------------
// supabase.js
// Booth → Supabase lead capture. Single write at form submit — no dead rows.
//
// One DB write per visitor, fired when they submit the lead form (name +
// phone + email + marketing opt-in). The payload also carries the
// landing-page data (gender, goal, optional age/height/weight bands) plus
// the scan results (body_type, frame_size). Visitors who scan but walk
// away before claiming the workout produce nothing in the DB — the booth
// gets the conversion, not the funnel.
//
// We use a SECURITY DEFINER RPC (`finalise_lead`) instead of a direct
// INSERT/UPSERT because something in this Supabase project (hidden trigger
// / restrictive policy / Studio-managed hook) was rejecting any UPDATE that
// touched the `name` column with a 42501 RLS error, even with WITH CHECK
// (true) on the UPDATE policy. The RPC body runs as the function owner,
// bypassing RLS for the INSERT...ON CONFLICT DO UPDATE statement inside.
// See supabase/migrations/2026-04-27_finalise_lead_rpc.sql.
//
// We don't use @supabase/supabase-js — for one REST call + a queue helper
// it would add ~50KB gzipped for nothing we'd use.
//
// Anon key is shipped in the public bundle. With the RPC handling all
// writes, anon's surface on the leads table itself can be tightened down
// to just EXECUTE on the function.
//
// Resilience:
//   • Each submission is queued to localStorage before the network call.
//   • Calls to the RPC are sequential — partial drains shrink the queue
//     so the rest can retry on the next visitor's submission.
//   • Worst case: a kiosk runs offline all day, queue grows to N
//     submissions, the first online visitor's submit flushes everyone's
//     data at once.
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
 * Calls public.finalise_lead — a SECURITY DEFINER Postgres function that
 * does the INSERT (or merge if scan_id already exists, e.g. a double-tap
 * retry) as the function owner, bypassing the opaque RLS WITH-CHECK
 * rejection that blocks direct UPSERT. The function does its own app-level
 * validation (scan_id present, contact fields non-empty) since RLS no
 * longer guards it.
 *
 * See supabase/migrations/2026-04-27_finalise_lead_rpc.sql for SQL.
 */
async function callFinaliseLeadRpc(payload) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase env vars missing — set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/finalise_lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase rpc/finalise_lead ${res.status}: ${errText.slice(0, 240)}`);
  }
}

// ============================== QUEUE =====================================
// Backs the form-submit RPC against flaky network. Each submission is
// queued to localStorage before the network call; on each submit attempt
// we try to drain the entire queue.

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
 * Form submit — the only DB write per visitor. Calls the SECURITY DEFINER
 * RPC `finalise_lead`, which inserts (or merges on rare retry) as the
 * function owner, bypassing the opaque RLS rejection that blocked our
 * direct UPSERT.
 *
 * Queues the payload locally first, then attempts to flush the whole
 * queue (current submission + any backed-up payloads from earlier offline
 * tries). RPC payloads can't be batched in one PostgREST call, so we
 * sequentially fire each one — partial successes shrink the queue.
 */
export async function finaliseLead({ scanId, name, email, phone, marketingOptIn, bodyType, frameSize, goal, gender, ageRange, heightRange, weightRange }) {
  // RPC argument names match the function signature (p_*). All landing-page
  // and scan fields ride along — this is the only DB write per visitor, so
  // every column lands in this single call.
  const rpcPayload = {
    p_scan_id: scanId,
    p_name: name || null,
    p_email: email || null,
    p_phone: phone || null,
    p_marketing_opt_in: Boolean(marketingOptIn),
    p_body_type: bodyType || null,
    p_frame_size: frameSize || null,
    p_gender: gender || null,
    p_goal: goal || null,
    p_age_range: ageRange || null,
    p_height_range: heightRange || null,
    p_weight_range: weightRange || null,
  };

  // Queue first — never lose a submission to a flaky network.
  const queue = readQueue();
  queue.push(rpcPayload);
  writeQueue(queue);

  if (!isSupabaseConfigured()) return 0;

  // Drain the queue one RPC at a time. We track which payloads succeeded so
  // a partial drain doesn't lose the rest.
  let sent = 0;
  const remaining = [];
  for (const item of queue) {
    try {
      await callFinaliseLeadRpc(item);
      sent++;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('finalise_lead RPC failed (retained for retry):', err);
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return sent;
}

/**
 * Operator escape-hatch: returns the current queue without modifying it.
 * Useful in devtools (`peekQueuedLeads()`) for triaging a stuck queue.
 */
export function peekQueuedLeads() {
  return readQueue();
}
