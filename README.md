# FitScan — SQUATWOLF

**Live:** https://dev-xanderr.github.io/fitscan/

---

## What is FitScan?

FitScan is a React-based web application that enables users to perform body measurements and composition scans, log their data over time, and visualise progress. Whether you're tracking changes from a training programme, monitoring weight loss, or dialling in your physique — FitScan gives you a clean, intuitive interface to stay on top of your numbers.

---

## Features

- **Skeleton Body Scan** — Uses TensorFlow.js (MoveNet) to detect body landmarks via webcam and estimate measurements in real time
- **Body Measurements Tracker** — Log key metrics: weight, body fat %, waist, chest, hips, arms, and more
- **Routine Generator** — JS-powered workout routine builder that generates personalised plans based on your scan data and goals
- **QR Code Sync** — Scan results are encoded into a QR code; visitors take their personalised routine to their phone instantly
- **Product Recommendations** — SQUATWOLF gear suggestions tailored to body type and fitness goal
- **Responsive UI** — Works on desktop and mobile browsers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Animation | Framer Motion |
| Body Scanning | TensorFlow.js (MoveNet skeleton detection) |
| Routine Generator | Vanilla JavaScript |
| State Management | Zustand |
| QR Encoding | lz-string + qrcode.react |
| Hosting | GitHub Pages (CI/CD via GitHub Actions) |

---

## Project Structure

```
fitscan/
├── public/
│   └── brand/            # SQUATWOLF logo assets
├── src/
│   ├── components/
│   │   ├── Booth/        # Booth flow (landing, scan results, QR, phone viewer)
│   │   ├── Camera/       # Webcam + skeleton overlay
│   │   ├── Routine/      # Workout day/exercise display components
│   │   └── UI/           # Shared UI primitives (Button, Spinner, etc.)
│   ├── context/          # Zustand store (scan state, routine, goals)
│   ├── services/         # TensorFlow pose service, routine generator, Claude API
│   ├── utils/            # Body metrics, product recommendations, constants
│   ├── index.css         # Design system (fonts, CSS variables)
│   └── App.jsx           # Root component + routing
├── .github/
│   └── workflows/
│       └── deploy.yml    # Auto-deploy to GitHub Pages on push to main
├── package.json
└── README.md
```

---

## Usage

1. **Select a goal** — Choose Build Muscle or Get Lean on the landing screen
2. **Run a body scan** — Allow webcam access; TensorFlow.js detects your skeleton to estimate body type and frame
3. **Get your routine** — FitScan generates a personalised weekly workout plan based on your scan and goal
4. **Take it with you** — Scan the QR code to load the exact same routine on your phone, with gear recommendations from SQUATWOLF

---

## Development

```bash
npm install
npm run dev
```

Requires a `.env.local` file with:

```
VITE_ANTHROPIC_API_KEY=your_key_here
VITE_SUPABASE_URL=https://dllsoplwcibepqlcigtu.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Only `VITE_ANTHROPIC_API_KEY` is required for `npm run dev` to actually function. The Supabase vars only matter for the booth lead-capture flow — without them, leads still queue to localStorage and the operator can drain manually.

### Lead capture / Supabase

The booth captures visitor leads (name / email / phone / gender + optional demographic buckets + marketing opt-in) and inserts them into a Supabase `leads` table via direct REST. The anon key is shipped in the public bundle; row-level security restricts the anon role to inserts only.

To bootstrap or verify the schema, run `supabase/bootstrap.sql` in the Supabase Studio SQL editor. It is idempotent — safe against an already-set-up project.

In CI, `VITE_SUPABASE_ANON_KEY` is read from a GitHub Actions secret so it can be rotated without a git history rewrite.

---

## Author

Xander — [@Dev-Xanderr](https://github.com/Dev-Xanderr)
