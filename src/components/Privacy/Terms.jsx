import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../UI/Button';
import { SectionLabel, BracketFrame, TopBar, BottomBar } from '../UI/Telemetry';
import { BRAND_CONTACT, ROUTES } from '../../utils/constants';

/**
 * Terms.jsx — full plain-English Terms & Privacy notice.
 *
 * Reachable from:
 *   • the consent modal ("Read full terms →")
 *   • the landing page footer link
 *   • a direct deep link from the brand site (/terms)
 *
 * Kept deliberately readable instead of legalese. Covers:
 *   01 / WHAT THE SCAN CAPTURES   — the camera, the model, what stays local
 *   02 / WHAT WE STORE            — the lead form vs. the scan (separate)
 *   03 / YOUR RIGHTS              — opt-out, deletion, no-sale
 *   04 / CONTACT                  — privacy email + jurisdiction
 *
 * Compliant in spirit with UAE PDPL (Federal Decree-Law No. 45 of 2021),
 * EU GDPR Art. 13/14 (transparency), and BIPA-style "biometric notice"
 * patterns in US state laws. A real deployment should run this past counsel
 * before going live — this is a template, not legal advice.
 */
export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-bg text-text relative overflow-hidden flex flex-col">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 80% 10%, rgba(185,58,50,0.16) 0%, rgba(0,0,0,1) 60%)',
        }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-accent/20 -z-10" aria-hidden="true" />

      <TopBar stage="TERMS" right={<span className="hidden sm:inline">DOC · 01</span>} />

      <main className="flex-1 px-6 sm:px-10 lg:px-16 py-10 lg:py-14 max-w-4xl mx-auto w-full">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="text-accent font-ui text-[11px] tracking-[0.4em] uppercase mb-3 flex items-center gap-3">
            <span className="w-8 h-px bg-accent" />
            HONESTY DOC · v1
          </div>
          <h1 className="font-heading text-6xl sm:text-7xl lg:text-8xl text-text leading-[0.82]">
            TERMS &amp;
            <br />
            <span className="text-accent">PRIVACY.</span>
          </h1>
          <p className="font-body text-text/60 text-base lg:text-lg max-w-2xl mt-6">
            What the booth does, what we keep, and what's yours to take back.
            Plain English. Read it once.
          </p>
        </motion.div>

        {/* 01 — SCAN */}
        <Section
          n="01"
          title="WHAT THE SCAN CAPTURES"
          delay={0.05}
        >
          <p>
            When you tap a goal, the kiosk asks for camera permission and
            opens a live video feed. A pose-detection model (Google MediaPipe
            MoveNet, running fully on this device) reads the position of 17
            joints — shoulders, hips, knees, elbows, wrists. Nothing about
            your face, identity or appearance is extracted.
          </p>
          <p>
            <strong className="text-text">The video never leaves this kiosk.</strong>{' '}
            It isn't streamed, isn't uploaded, isn't recorded. The model runs in
            the browser using WebGL. We never see the picture.
          </p>
          <p>
            One snapshot is captured the moment your pose is locked, used in
            memory to compute body proportions, then discarded when you walk
            away or the booth resets. It's not written to disk and not
            transmitted.
          </p>
        </Section>

        {/* 02 — STORE */}
        <Section n="02" title="WHAT WE STORE" delay={0.1}>
          <p>
            Two things, and they're separate:
          </p>
          <ul className="space-y-3 mt-4 list-none">
            <li className="flex gap-4">
              <span className="font-ui text-accent text-[11px] tabular-nums mt-1 shrink-0">
                A
              </span>
              <span>
                <strong className="text-text">Your routine, in your hand.</strong>{' '}
                The QR code at the end encodes your routine into a link. Your
                phone reads it directly — nothing about that handover passes
                through our servers.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="font-ui text-accent text-[11px] tabular-nums mt-1 shrink-0">
                B
              </span>
              <span>
                <strong className="text-text">Your email, if you offer it.</strong>{' '}
                If you opt to have the routine emailed to you, we keep your
                email address (and first name, if given) to send it. If you
                tick the marketing box, we add you to SquatWolf's brand
                newsletter — unsubscribe at the bottom of any email.
              </span>
            </li>
          </ul>
          <p className="mt-4">
            We never sell or rent your contact info. We don't pair it with the
            scan image (we don't have the scan image).
          </p>
        </Section>

        {/* 03 — RIGHTS */}
        <Section n="03" title="YOUR RIGHTS" delay={0.15}>
          <p>You can, at any time:</p>
          <ul className="space-y-2 mt-3 list-none">
            <li className="flex gap-4">
              <span className="text-accent font-ui text-[11px] mt-0.5">▸</span>
              <span>Ask us what we hold about you (it's just an email row).</span>
            </li>
            <li className="flex gap-4">
              <span className="text-accent font-ui text-[11px] mt-0.5">▸</span>
              <span>Have it deleted, no questions asked.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-accent font-ui text-[11px] mt-0.5">▸</span>
              <span>Withdraw marketing consent without losing access to anything else.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-accent font-ui text-[11px] mt-0.5">▸</span>
              <span>Decline the scan entirely. The booth has a manual fallback that builds a routine without the camera.</span>
            </li>
          </ul>
        </Section>

        {/* 04 — CONTACT */}
        <Section n="04" title="CONTACT" delay={0.2}>
          <p>
            For any of the above, or if something here looks wrong, write to:
          </p>
          <div className="mt-4 inline-block border border-text/15 px-5 py-4 bg-text/[0.03]">
            <div className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/40 mb-1">
              Data controller
            </div>
            <div className="font-heading text-2xl text-text leading-none">
              SQUATWOLF
            </div>
            <div className="font-body text-text/60 text-sm mt-2">
              {BRAND_CONTACT.jurisdiction}
            </div>
            <a
              href={`mailto:${BRAND_CONTACT.email}`}
              className="block font-ui text-accent text-sm mt-2 hover:underline"
            >
              {BRAND_CONTACT.email}
            </a>
          </div>
          <p className="text-text/40 text-xs mt-6 font-ui tracking-[0.2em] uppercase">
            Last updated · 21 APR 2026
          </p>
        </Section>

        {/* CTA back to landing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-14 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
        >
          <Button variant="primary" onClick={() => navigate(ROUTES.LANDING)}>
            ▸ BACK TO BOOTH
          </Button>
          <span className="font-ui text-text/40 text-[10px] tracking-[0.3em] uppercase">
            ▸ ANY QUESTIONS, EMAIL ABOVE
          </span>
        </motion.div>
      </main>

      <BottomBar stage={0} tagline="▸ HONEST. UPFRONT. NO SMALL PRINT." />
    </div>
  );
}

/** A numbered section. Outer bracket on hover, prose inside. */
function Section({ n, title, delay = 0, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative mb-12"
    >
      <SectionLabel n={n} title={title} />
      <div className="mt-5 pl-0 sm:pl-1 max-w-3xl font-body text-text/70 text-base leading-relaxed space-y-4">
        {children}
      </div>
    </motion.section>
  );
}
