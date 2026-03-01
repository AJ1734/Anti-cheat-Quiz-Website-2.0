# Requirements

## Runtime

- **Browser:** Any modern browser (Chrome, Firefox, Edge, Safari). JavaScript must be enabled.
- **No server required:** You can open `index.html` directly or use a static file server (e.g. `npx serve .`).
- **No build step:** No Node.js, npm, or bundler required to run the application.

## Optional

- **Node.js / npx:** Only if you want to run a local static server (e.g. `npx serve .`).
- **Firebase project:** Only if you want a shared database; otherwise the app uses browser localStorage/sessionStorage.

## Dependencies (in-repo / CDN)

The app uses only:

- **HTML, CSS, JavaScript** (vanilla).
- **Firebase JS SDK** (loaded via CDN only when Firebase is configured): `firebase-app-compat`, `firebase-firestore-compat`.
- **SheetJS (xlsx)** (loaded via CDN on admin dashboard): used for exporting quiz results to Excel (`.xlsx`).

No `package.json` dependencies or `requirements.txt` are required for the core app to run.
