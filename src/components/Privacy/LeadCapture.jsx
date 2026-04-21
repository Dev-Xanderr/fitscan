import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import Button from '../UI/Button';
import { SectionLabel, BracketFrame } from '../UI/Telemetry';
import { STORAGE_KEYS } from '../../utils/constants';

/**
 * LeadCapture — opt-in inbox delivery form on the routine screen.
 *
 * Sits in section "04 / SAVE TO INBOX" of BoothRoutine. Visitor has already
 * been delivered a routine (the value transaction); we are not gating
 * anything behind this. They can ignore it and walk away with the QR.
 *
 * Submission strategy:
 *   • If VITE_LEAD_ENDPOINT is set → POST JSON to that URL.
 *   • Whether or not the network call succeeds, the lead also writes to
 *     localStorage[STORAGE_KEYS.LEADS] as a JSON array, so an unattended
 *     kiosk doesn't lose leads if the network is flaky. The operator can
 *     drain leads at end of day via DevTools.
 *
 * What we record:
 *   { email, name, marketingOptIn, capturedAt, bodyType, goal, source }
 *
 * What we deliberately do NOT record: the snapshot, the keypoints, or the
 * full generated routine. The routine itself rides home with the visitor
 * via the QR code; we don't need a copy.
 */
export default function LeadCapture() {
  const bodyType = useScanStore((s) => s.bodyType);
  const boothGoal = useScanStore((s) => s.boothGoal);
  const leadCaptured = useScanStore((s) => s.leadCaptured);
  const setLeadCaptured = useScanStore((s) => s.setLeadCaptured);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const lead = {
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      marketingOptIn: optIn,
      capturedAt: new Date().toISOString(),
      bodyType: bodyType || null,
      goal: boothGoal || null,
      source: 'booth-fitscan',
    };

    // Persist locally first — that's the safety net if the POST fails.
    persistLeadLocally(lead);

    const endpoint = import.meta.env.VITE_LEAD_ENDPOINT;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        // Don't surface network errors to the visitor — the lead is already
        // safe in localStorage. Just log it for the operator.
        console.warn('Lead endpoint failed (saved locally):', err);
      }
    }

    setSubmitting(false);
    setLeadCaptured(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-12"
    >
      <SectionLabel n="04" title="SAVE TO INBOX" />

      <div className="mt-5 relative border border-text/10 bg-text/[0.02] p-6 sm:p-8">
        <BracketFrame size="md" color="muted" />

        <AnimatePresence mode="wait">
          {leadCaptured ? (
            <SuccessState key="success" />
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              noValidate
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end"
            >
              <div>
                <h3 className="font-heading text-3xl sm:text-4xl text-text leading-none">
                  ROUTINE TO YOUR
                  <br />
                  <span className="text-accent">INBOX.</span>
                </h3>
                <p className="font-body text-text/50 text-sm mt-3 max-w-md">
                  Skip the QR if your phone's away. Drop your email and we'll
                  send the full plan. Optional — the QR works either way.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    label="EMAIL"
                    required
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                  />
                  <Field
                    label="FIRST NAME"
                    type="text"
                    autoComplete="given-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="optional"
                  />
                </div>

                <label className="mt-5 flex items-start gap-3 cursor-pointer group">
                  <span
                    className={`mt-0.5 w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                      optIn
                        ? 'bg-accent border-accent'
                        : 'border-text/30 group-hover:border-text/60'
                    }`}
                    aria-hidden="true"
                  >
                    {optIn && (
                      <span className="text-text text-[9px] leading-none">✓</span>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={optIn}
                    onChange={(e) => setOptIn(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="font-ui text-[11px] tracking-[0.2em] uppercase text-text/50 group-hover:text-text/80 transition-colors leading-relaxed">
                    Send me occasional SQUATWOLF drops &amp; brand updates.
                    <br className="hidden sm:inline" />
                    <span className="text-text/30 normal-case tracking-normal text-[10px]">
                      Unsubscribe any time.
                    </span>
                  </span>
                </label>

                {error && (
                  <div className="mt-4 font-ui text-[11px] tracking-[0.2em] uppercase text-accent">
                    ▸ {error}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 self-stretch lg:self-end">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!email.trim() || submitting}
                >
                  {submitting ? 'SENDING…' : '▸ EMAIL ME'}
                </Button>
                <span className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/30 text-center lg:text-right">
                  ▸ NO SPAM. EVER.
                </span>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

/** Telemetry-style input: small uppercase Azeret Mono label, bottom-border-only field. */
function Field({ label, required = false, ...inputProps }) {
  return (
    <label className="block">
      <span className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/40">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </span>
      <input
        required={required}
        {...inputProps}
        className="mt-2 w-full bg-transparent border-0 border-b border-text/20 focus:border-accent outline-none py-2 font-body text-text placeholder:text-text/20 text-base transition-colors"
      />
    </label>
  );
}

function SuccessState() {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="py-6"
    >
      <div className="font-ui text-[10px] tracking-[0.5em] uppercase text-accent mb-3">
        ▸ SAVED
      </div>
      <h3 className="font-heading text-3xl sm:text-4xl text-text leading-none">
        ROUTINE
        <br />
        <span className="text-accent">IN YOUR INBOX.</span>
      </h3>
      <p className="font-body text-text/50 text-sm mt-3 max-w-md">
        Check your email in a minute or two. The QR's still on screen if you'd
        rather take it now.
      </p>
    </motion.div>
  );
}

/**
 * Append a lead to the localStorage queue. Best-effort — if storage is full
 * or unavailable we just log and move on. The booth has no other recovery.
 */
function persistLeadLocally(lead) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.LEADS);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(lead);
    window.localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(queue));
  } catch (err) {
    console.warn('Could not persist lead to localStorage:', err);
  }
}
