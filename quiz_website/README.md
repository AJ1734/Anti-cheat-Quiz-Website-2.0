# Quiz Portal – VITAP Academic Assessment Platform

A professional, dark-mode quiz website with strict anti-cheating, two-tier authentication (Student + Admin), and an administrative dashboard. Built with **HTML, CSS, and JavaScript** only—no build step required. Optional Firebase/Firestore backend for production use.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## Features

- **Two-tier authentication**
  - **Students:** Login with Full Name, Email (must end with `@vitapstudent.ac.in`), and Registration Number (e.g. `23BCE7372`, `23BEC20195`). Can log in and out anytime.
  - **Admin:** Hidden entry on the landing page (bottom-left corner). Credentials: **adminngc** / **chocopie**.

- **Admin dashboard**
  - Create and host multiple quizzes with custom titles and time limits.
  - Add unlimited questions; each question can have multiple choice options (mark one correct).
  - View all attempts; filter by quiz; **reset attempt** per user to allow a retake.
  - **Download quiz results as Excel:** Each quiz’s results can be downloaded separately as an `.xlsx` file with full details (student name, email, reg no, score, percentage, submitted time, blocked status, and per-question answers).

- **User experience**
  - Dashboard lists available quizzes; one attempt per quiz unless admin resets.
  - Visible countdown timer; questions on a single page with smooth scrolling; submit when done.

- **Anti-cheating**
  - **One warning, second strike = quiz closed and attempt blocked.**
  - Detects: tab switch, window blur, significant resize (e.g. split-screen), copy/paste/right-click (disabled).
  - Tailored warning messages; second violation triggers auto-submit, block, and redirect to a blocked page.

---

## Quick Start

### Option 1: Open directly

1. Clone or download this repository.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari).

### Option 2: Local server (recommended)

```bash
# From the project root
npx serve .
# Or, if you have Node.js and prefer port 3333:
npx serve . -p 3333
```

Then open the URL shown (e.g. `http://localhost:3000` or `http://localhost:3333`).

**Without Firebase:** All data is stored in the browser (localStorage/sessionStorage). Suitable for demos and single-machine use.

---

## Requirements

- A **modern web browser** (Chrome, Firefox, Edge, Safari).
- **No Node.js or npm required** to run the app (only optional for `npx serve`).
- **Optional:** A Firebase project if you want a shared database (see [Firebase setup](#firebase-optional) below).

See [REQUIREMENTS.md](REQUIREMENTS.md) for a formal requirements summary.

---

## Project Structure

```
quiz_website/
├── index.html              # Landing page (hidden admin trigger: bottom-left)
├── login.html              # Student login
├── user-dashboard.html     # Student quiz list
├── quiz.html               # Take quiz (timer + anti-cheat)
├── admin-login.html        # Admin login
├── admin-dashboard.html    # Create quizzes, view attempts, download Excel
├── blocked.html            # Shown when quiz is terminated for cheating
├── css/
│   └── styles.css          # Dark theme, layout, components
├── js/
│   ├── firebase-config.js  # Firebase config (optional)
│   ├── auth-validation.js # Email & reg number validation
│   ├── storage.js          # localStorage + session helpers
│   ├── login.js            # Student login logic
│   ├── user-dashboard.js  # Load quizzes & attempts
│   ├── quiz.js             # Quiz taking, timer, submit/terminate
│   ├── anti-cheat.js       # Visibility, blur, resize, copy/paste
│   └── admin-dashboard.js # Quiz builder, attempts, reset, Excel export
├── README.md               # This file
├── REQUIREMENTS.md         # Requirements summary
├── LICENSE                 # MIT License
└── .gitignore
```

---

## Admin: Download Quiz Results as Excel

1. Log in as **admin** (hidden link on landing → **adminngc** / **chocopie**).
2. In **Users & Attempts**, select a quiz from the **Filter by Quiz** dropdown.
3. Click **Download results (Excel)**.
4. An `.xlsx` file is downloaded for that quiz only, containing:
   - Full Name, Email, Registration Number  
   - Score, Total Questions, Percentage  
   - Submitted At, Blocked (Yes/No)  
   - Per-question selected answer (Q1 Answer, Q2 Answer, …)

Each quiz’s results are downloaded **separately**; only the selected quiz’s attempts are included.

---

## Firebase (Optional)

For a shared backend (multiple users, persistent data across devices):

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Firestore Database**.
3. Copy your project config into `js/firebase-config.js` (replace `YOUR_API_KEY`, `YOUR_PROJECT_ID`, etc.).
4. In Firestore, create these collections (and indexes if prompted):

### Collections

| Collection  | Fields |
|------------|--------|
| **users**  | `fullName`, `email`, `regNo`, `createdAt` |
| **quizzes**| `title`, `timeLimitSeconds`, `questions` (array of `{ text, options: [{ text, isCorrect }] }`), `createdAt` |
| **attempts** | `userId`, `quizId`, `userName`, `userEmail`, `startedAt`, `submittedAt`, `answers`, `score`, `blocked` |

If you use composite queries (e.g. `attempts` by `userId` + `quizId`), create the suggested composite index when Firestore asks.

---

## Usage Summary

| Role   | Action |
|--------|--------|
| Student | Go to **Student Login** → enter name, `*@vitapstudent.ac.in` email, reg no (e.g. `23BCE7372`) → open dashboard → start a quiz. |
| Admin  | On landing page, click the **tiny dot in the bottom-left corner** → log in with **adminngc** / **chocopie** → create quizzes, view attempts, reset attempts, **download results as Excel** per quiz. |

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.

---

## Contributing

1. Fork the repository.
2. Create a branch for your change.
3. Submit a pull request with a clear description of the change.

If you want more detailed guidelines, open an issue and we can add a CONTRIBUTING.md.
