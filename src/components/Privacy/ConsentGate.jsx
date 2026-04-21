import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../UI/Button';
import { SectionLabel, BracketFrame } from '../UI/Telemetry';
import { ROUTES } from '../../utils/constants';

/**
 * ConsentGate — modal interstitial that fires when a visitor commits to a scan.
 *
 *   Landing → tap goal → ConsentGate appears → Accept → /scan
 *
 * Why a modal and not a buried checkbox: the kiosk is going to point a camera
 * at someone and process biometric-adjacent data (joint coordinates). UAE PDPL
 * and EU GDPR both want consent to be specific, informed and freely given.
 * A modal that says exactly what we're about to do is harder to pretend you
 * didn't see than a tiny "I agree" tickbox.
 *
 * Props:
 *   open      — controlled visibility
 *   onAccept  — called when visitor agrees; the parent should set the consent
 *               flag and continue navigation
 *   onDecline — called when visitor backs out; parent should typically just
 *               close the modal (visitor stays on landing)
 *
 * a11y: dialog role + Esc handler + focus moves to Accept button on open and
 * restores to the opener on close. Same pattern as the day-detail modal.
 */
export default function ConsentGate({ open, onAccept, onDecline }) {
  const acceptBtnRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = 'consent-gate-title';

  useEffect(() => {
    if (!open) {
      if (openerRef.current) {
        openerRef.current.focus();
        openerRef.current = null;
      }
      return;
    }

    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }

    const onKey = (e) => {
      if (e.key === 'Escape') onDecline();
    };
    window.addEventListener('keydown', onKey);
    // Focus the affirmative action — visitor's choice but cursor is already
    // there if they want to commit fast. Decline is still one tab away.
    acceptBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDecline]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop — clicking it does NOT auto-decline. Visitor has to make
              an explicit choice; consent has to be a positive action. */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="relative bg-bg border border-text/15 w-full max-w-2xl max-h-[88vh] overflow-y-auto p-7 sm:p-10"
          >
            <BracketFrame size="md" color="accent" />

            {/* Eyebrow */}
            <div className="font-ui text-[10px] tracking-[0.5em] uppercase text-accent mb-3">
              ▸ HEADS UP
            </div>

            {/* Title */}
            <h2
              id={titleId}
              className="font-heading text-4xl sm:text-5xl text-text leading-[0.85]"
            >
              WE'RE GOING TO
              <br />
              <span className="text-accent">SCAN YOU.</span>
            </h2>

            <p className="font-body text-text/60 text-sm sm:text-base mt-5">
              Quick honesty pass before the camera turns on. Three sentences.
            </p>

            {/* Bullets — numbered, terse, factual */}
            <ul className="mt-7 space-y-4">
              <ConsentPoint n="01" title="The video stays here.">
                Pose detection runs in this kiosk. Nothing streams out, nothing
                gets uploaded. We never see the picture.
              </ConsentPoint>
              <ConsentPoint n="02" title="It's joints, not faces.">
                The model reads 17 body keypoints to build your routine. No
                facial recognition. No identity match.
              </ConsentPoint>
              <ConsentPoint n="03" title="Email is optional and after.">
                You'll only be asked to share contact details once the routine
                is built — and only if you want it sent to you.
              </ConsentPoint>
            </ul>

            {/* Read-more link */}
            <div className="mt-6 pt-5 border-t border-text/10">
              <Link
                to={ROUTES.TERMS}
                className="font-ui text-[11px] tracking-[0.3em] uppercase text-text/50 hover:text-accent transition-colors"
              >
                ▸ READ FULL TERMS &amp; PRIVACY
              </Link>
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Button variant="booth" onClick={onDecline}>
                NOT NOW
              </Button>
              <div className="flex-1" />
              <Button
                variant="primary"
                onClick={onAccept}
                ref={acceptBtnRef}
              >
                ▸ ACCEPT &amp; SCAN
              </Button>
            </div>

            {/* Mini telemetry footer */}
            <div className="mt-6 pt-4 border-t border-text/10 flex items-center justify-between font-ui text-[10px] tracking-[0.4em] uppercase text-text/30">
              <span>CONSENT / 01 OF 01</span>
              <span className="text-accent">▸ YOUR CALL</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Numbered consent bullet styled to match the SectionLabel rail elsewhere. */
function ConsentPoint({ n, title, children }) {
  return (
    <li className="grid grid-cols-[40px_1fr] gap-4 items-start">
      <span className="font-ui text-[11px] tracking-[0.3em] text-accent tabular-nums mt-1">
        {n}
      </span>
      <div>
        <div className="font-heading text-text text-xl leading-tight">
          {title}
        </div>
        <p className="font-body text-text/55 text-sm mt-1 leading-relaxed">
          {children}
        </p>
      </div>
    </li>
  );
}
