// Unified storage: uses Firebase when available, else localStorage for demo
const STORAGE_KEYS = {
  QUIZZES: 'quiz_website_quizzes',
  ATTEMPTS: 'quiz_website_attempts',
  USERS: 'quiz_website_users'
};

function getQuizzesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

function saveQuizzesToStorage(quizzes) {
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
}

function getAttemptsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

function saveAttemptsToStorage(attempts) {
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
}

function getUsersFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

function saveUsersToStorage(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
  const raw = sessionStorage.getItem('quiz_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function isAdmin() {
  return sessionStorage.getItem('quiz_admin') === '1';
}
