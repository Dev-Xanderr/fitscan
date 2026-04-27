import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import Button from '../UI/Button';
import { SectionLabel, BracketFrame } from '../UI/Telemetry';
import { finaliseLead } from '../../services/supabase';

/**
 * LeadCapture — opt-in inbox delivery form on the routine screen.
 *
 * Sits in section "04 / SAVE TO INBOX" of BoothRoutine. Visitor has already
 * been delivered a routine (the value transaction); we are not gating
 * anything behind this. They can ignore it and walk away with the QR.
 *
 * Seamless-UX moves:
 *   • Three fields (Name / Phone / Email) in one visual row so the form
 *     reads as a single telemetry terminal, not a multi-step obligation.
 *   • Gender is pre-filled from the landing selection (ScanContext.userInfo.gender)
 *     and shown as a tap-to-swap chip — we don't double-ask for data we
 *     already captured.
 *   • Each input has the right `inputMode` so booth touchscreens surface
 *     the numeric keypad on phone and the @-included keyboard on email.
 *   • Enter advances: Name→Phone→Email→Submit. Never forces a thumb to
 *     hunt for a "Next" button.
 *   • No autofocus on mount — visitor taps first, so they're committed
 *     before the virtual keyboard jumps up.
 *   • Optimistic success state — "ON ITS WAY." flashes the instant they
 *     tap SEND; the network round-trip is fire-and-forget behind it.
 *
 * Submission strategy (see services/supabase.js):
 *   This is the *second* of two writes per booth visitor. Phase 1 ran on
 *   landing (gender + goal + optional demographics) keyed by scan_id. This
 *   form-submit upsert merges contact info onto that same row.
 *   • finaliseLead() queues the upsert payload to localStorage first
 *     (never lose a submission to a flaky network), then attempts to flush
 *     the entire queue to Supabase in one transactional batch. On success
 *     the queue clears; on failure it's retained for retry on the next
 *     visitor's submission.
 *   • The success state flips optimistically — visitor sees "ON ITS WAY."
 *     immediately, the network call is fire-and-forget behind it.
 */
export default function LeadCapture() {
  const bodyType = useScanStore((s) => s.bodyType);
  const frameSize = useScanStore((s) => s.frameSize);
  const boothGoal = useScanStore((s) => s.boothGoal);
  const gender = useScanStore((s) => s.userInfo?.gender);
  // Optional demographic buckets picked on landing — null when skipped.
  // Persist the human-readable label (e.g. "25-34") rather than the numeric
  // midpoint so marketing can segment on the same buckets visitors saw.
  const ageRange = useScanStore((s) => s.userInfo?.ageRange);
  const heightRange = useScanStore((s) => s.userInfo?.heightRange);
  const weightRange = useScanStore((s) => s.userInfo?.weightRange);
  // Row key for the two-phase Supabase write — set on landing when the
  // visitor accepts consent. We pass it through to finaliseLead so the
  // upsert merges onto the same row created at scan-start.
  const scanId = useScanStore((s) => s.scanId);
  const setGender = useScanStore((s) => s.setGender);
  const leadCaptured = useScanStore((s) => s.leadCaptured);
  const setLeadCaptured = useScanStore((s) => s.setLeadCaptured);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Refs let us hop focus forward on Enter without a click. Touchscreen
  // typing is already slow enough without forcing the visitor to find the
  // next field with their eyes.
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!phone.trim() || digitsOnly(phone).length < 7) return 'Phone looks too short';
    if (!email.trim() || !email.includes('@')) return 'Email looks off';
    return null;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    // Optimistic flip — the visitor sees "ON ITS WAY." instantly. If the
    // network upsert fails, finaliseLead retains the payload in localStorage
    // for the next visitor's submission to retry. No reason to make them
    // wait on a spinner for an action whose failure mode is invisible.
    setSubmitting(true);
    setLeadCaptured(true);

    // Fire-and-forget phase-2 upsert. finaliseLead queues to localStorage
    // first, then attempts the network call (single-batch flush of the
    // entire queue). Defensive: we pass landing-page fields too in case
    // phase 1's INSERT dropped — the upsert's MERGE will create a complete
    // row from this single call if that's all the server has seen.
    finaliseLead({
      scanId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      gender: normaliseGender(gender),
      marketingOptIn: optIn,
      bodyType: bodyType || null,
      frameSize: frameSize || null,
      goal: boothGoal || null,
      ageRange: ageRange || null,
      heightRange: heightRange || null,
      weightRange: weightRange || null,
    });

    setSubmitting(false);
  };

  // Enter in field N → focus field N+1. Enter on the last field submits.
  const onEnter = (e, next) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (next === 'submit') {
      handleSubmit(e);
    } else if (next?.current) {
      next.current.focus();
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-12"
    >
      <SectionLabel n="04" title="UNLOCK TAKE-HOME" />

      <div className="mt-5 relative border border-text/10 bg-text/[0.02] p-6 sm:p-8">
        <BracketFrame size="md" color="muted" />

        <AnimatePresence mode="wait">
          {leadCaptured ? (
            <SuccessState key="success" name={name} />
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              noValidate
              className="space-y-8"
            >
              {/* Hero row — headline left, gender chip right */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-start">
                <div>
                  <h3 className="font-heading text-3xl sm:text-4xl text-text leading-none">
                    TAKE IT
                    <br />
                    <span className="text-accent">HOME.</span>
                  </h3>
                  <p className="font-body text-text/50 text-sm mt-3 max-w-md">
                    Your plan's locked in. Drop your details to unlock the
                    take-home QR — we'll email a copy too so it's safe in
                    your inbox.
                  </p>
                </div>

                <GenderChip gender={gender} onSwap={setGender} />
              </div>

              {/* Three-field row — Name · Phone · Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Field
                  ref={nameRef}
                  label="NAME"
                  required
                  type="text"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => onEnter(e, phoneRef)}
                  placeholder="Alex"
                />
                <Field
                  ref={phoneRef}
                  label="PHONE"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => onEnter(e, emailRef)}
                  placeholder="+971 50 123 4567"
                />
                <Field
                  ref={emailRef}
                  label="EMAIL"
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => onEnter(e, 'submit')}
                  placeholder="you@domain.com"
                />
              </div>

              {/* Bottom row — opt-in toggle + send button */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-end pt-2">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
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
                    <span className="text-text/30 normal-case tracking-normal text-[10px] block mt-1">
                      Unsubscribe any time.
                    </span>
                  </span>
                </label>

                <div className="flex flex-col gap-2 self-stretch sm:self-end">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'UNLOCKING…' : '▸ UNLOCK QR'}
                  </Button>
                  <span className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/30 text-center sm:text-right">
                    ▸ NO SPAM. EVER.
                  </span>
                </div>
              </div>

              {error && (
                <div className="font-ui text-[11px] tracking-[0.2em] uppercase text-accent">
                  ▸ {error}
                </div>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

/**
 * Gender chip — displays the landing-selected gender and lets the visitor
 * swap it in one tap without a drop-down or dialog. Matches the telemetry
 * aesthetic: uppercase Azeret Mono label, accent "tap to change" hint.
 */
function GenderChip({ gender, onSwap }) {
  const normalised = normaliseGender(gender) || 'male';
  const handleSwap = () => {
    onSwap(normalised === 'male' ? 'female' : 'male');
  };
  return (
    <button
      type="button"
      onClick={handleSwap}
      className="group shrink-0 flex flex-col items-start gap-1.5 border border-text/15 hover:border-accent bg-text/[0.02] hover:bg-accent/[0.06] px-5 py-3.5 rounded-none hover:rounded-lg transition-all text-left cursor-pointer"
      aria-label={`Gender: ${normalised}. Tap to change.`}
    >
      <span className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/40 group-hover:text-accent transition-colors">
        GENDER
      </span>
      <span className="flex items-center gap-2">
        <span className="font-heading text-2xl leading-none text-text uppercase">
          {normalised}
        </span>
        <span className="font-ui text-[9px] tracking-[0.3em] uppercase text-text/30 group-hover:text-text/60 transition-colors">
          ▸ TAP
        </span>
      </span>
    </button>
  );
}

/**
 * Telemetry-style input. Uses forwardRef-in-a-closure via function-component
 * ref assignment (React 19 forwards the `ref` prop automatically to function
 * components, so no explicit forwardRef wrapper needed).
 */
function Field({ ref, label, required = false, ...inputProps }) {
  return (
    <label className="block">
      <span className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/40">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </span>
      <input
        ref={ref}
        required={required}
        {...inputProps}
        className="mt-2 w-full bg-transparent border-0 border-b border-text/20 focus:border-accent outline-none py-2 font-body text-text placeholder:text-text/20 text-base transition-colors"
      />
    </label>
  );
}

/**
 * Success panel — matches the "LOCKED." visual beat from the scan-complete
 * overlay so the form submission feels like a continuation of the same
 * flow, not a separate transactional step.
 */
function SuccessState({ name }) {
  const firstName = (name || '').split(' ')[0];
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="py-6"
    >
      <div className="font-ui text-[10px] tracking-[0.5em] uppercase text-accent mb-3">
        ▸ UNLOCKED
      </div>
      <h3 className="font-heading text-4xl sm:text-5xl text-text leading-none">
        QR IS
        <br />
        <span className="text-accent">YOURS.</span>
      </h3>
      <p className="font-body text-text/50 text-sm mt-4 max-w-md">
        {firstName
          ? `Scan the code above, ${firstName} — or wait a minute and check your inbox. `
          : 'Scan the code above — or wait a minute and check your inbox. '}
        Either way, the plan follows you home.
      </p>
    </motion.div>
  );
}

/** Strip everything but digits — used for phone length validation. */
function digitsOnly(s) {
  return (s || '').replace(/[^0-9]/g, '');
}

/**
 * DEFAULT_USER_INFO seeds gender as 'Other' (capitalised). Landing forces
 * it to 'male' / 'female' (lowercase) before the visitor reaches the
 * routine page. Normalise on write so Supabase sees one of three values
 * and never the capitalised default.
 */
function normaliseGender(g) {
  if (!g) return null;
  const lower = String(g).toLowerCase();
  if (lower === 'male' || lower === 'female') return lower;
  return 'other';
}
