## What is FitScan?

FitScan is a React-based web application that enables users to perform body measurements and composition scans, log their data over time, and visualise progress. Whether you're tracking changes from a training programme, monitoring weight loss, or dialling in your physique — FitScan gives you a clean, intuitive interface to stay on top of your numbers.

---

## Features

- **Skeleton Body Scan** — Uses TensorFlow.js (PoseNet / MoveNet) to detect body landmarks via webcam and estimate measurements in real time
- **Body Measurements Tracker** — Log key metrics: weight, body fat %, waist, chest, hips, arms, and more
- **Routine Generator** — JS-powered workout routine builder that generates personalised plans based on your scan data and goals
- **Responsive UI** — Works on desktop and mobile browsers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Body Scanning | TensorFlow.js (PoseNet / MoveNet skeleton detection) |
| Routine Generator | Vanilla JavaScript |
| State Management | React Context / useState |

---

## Project Structure

```
fitscan/
├── public/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-level page components
│   ├── context/          # Global state (user data, scan history)
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions (calculations, formatting)
│   ├── styles/           # Global styles
│   └── App.jsx           # Root component
├── package.json
└── README.md
```

---

## Usage

1. **Create your profile** — Enter your baseline stats and fitness goals on first launch
2. **Run a body scan** — Allow webcam access and let TensorFlow.js detect your skeleton to estimate body measurements
3. **Generate a routine** — FitScan's routine generator builds a personalised workout plan based on your scan data and goals
---


## Author

**Xander** — [@Dev-Xanderr](https://github.com/Dev-Xanderr)

---

> Built for athletes who want more than just a scale. Track the full picture.
