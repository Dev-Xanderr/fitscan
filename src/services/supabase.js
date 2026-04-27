// ---------------------------------------------------------------------------
// supabase.js
// Booth → Supabase lead capture, direct-REST style.
//
// We don't use @supabase/supabase-js because the booth only ever inserts into
// one table and never authenticates, queries, or subscribes. The official
// client adds ~50KB gzipped for nothing we'd use here. A single fetch POST
// against /rest/v1/leads with the anon key in headers does the same job.
//
// The anon key is *intentionally* shipped in the static bundle. Supabase RLS
// (row-level security) is the actual security boundary: the anon role is
// configured to ONLY allow inserts on `leads` — no select / update / delete.
// See supabase/migrations/ for the schema + policy SQL.
//
// Resilience strategy:
//   • Every submitted lead is appended to a localStorage queue first.
//   • We then attempt to flush the entire queue to Supabase (current lead +
//     anything backed up from earlier offline submissions).
//   • Supabase batch insert is transactional — all-or-nothing per request,
//     so on success we clear the queue, on failure we leave it intact.
//   • Worst case: a kiosk runs offline all day, queue grows to N leads,
//     next online visitor's submission flushes everyone's data at once.
// ---------------------------------------------------------------------------

import { STORAGE_KEYS } from '../utils/constants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE = 'leads';
const STORAGE_KEY = STORAGE_KEYS.LEADS;

/**
 * True when both env vars are populated. If false we still queue leads
 * locally — the operator can drain the queue manually from devtools.
 */
export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * POST a batch of leads. Throws on non-2xx so the caller can decide whether
 * to retain the local queue.
 */
async function postLeads(leads) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase env vars missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      // Don't echo the inserted rows back — saves bandwidth and avoids needing
      // a SELECT policy on the anon role.
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(leads),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase insert ${res.status}: ${errText.slice(0, 240)}`);
  }
}

/** Read the localStorage backup queue. Returns [] if anything is wrong. */
function readQueue() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persist the localStorage backup queue. Best-effort. */
function writeQueue(queue) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    // Storage full or unavailable. Nothing to recover gracefully.
    // eslint-disable-next-line no-console
    console.warn('Could not persist lead queue:', err);
  }
}

/**
 * Append a lead to the local backup queue. Always runs before the network
 * call so we never lose a submission to a flaky network.
 */
export function queueLeadLocally(lead) {
  const queue = readQueue();
  queue.push(lead);
  writeQueue(queue);
}

/**
 * Try to flush every queued lead to Supabase in one transactional batch.
 * If the network call succeeds the queue is cleared; if it fails, the queue
 * is retained so the next visitor's submission triggers another retry.
 *
 * Resolves to the number of leads sent (0 means nothing happened — either
 * nothing queued, Supabase isn't configured, or the network call failed).
 */
export async function flushQueuedLeads() {
  if (!isSupabaseConfigured()) return 0;
  const queue = readQueue();
  if (queue.length === 0) return 0;
  try {
    await postLeads(queue);
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
 * Useful in devtools for `JSON.stringify(peekQueuedLeads(), null, 2)` to
 * eyeball a stuck queue.
 */
export function peekQueuedLeads() {
  return readQueue();
}
