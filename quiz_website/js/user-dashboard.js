(function() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('userName').textContent = user.fullName || user.email || 'Student';
  document.getElementById('logoutBtn').href = 'index.html';

  function loadQuizzes(cb) {
    if (window.db) {
      window.db.collection('quizzes').orderBy('createdAt', 'desc').get().then(function(snap) {
        cb(snap.docs.map(function(d) { var x = d.data(); x.id = d.id; return x; }));
      }).catch(function() { cb(getQuizzesFromStorage()); });
    } else {
      cb(getQuizzesFromStorage());
    }
  }

  function loadAttempts(cb) {
    if (window.db) {
      window.db.collection('attempts').where('userId', '==', user.id).get().then(function(snap) {
        cb(snap.docs.map(function(d) { var x = d.data(); x.id = d.id; return x; }));
      }).catch(function() { cb(getAttemptsForUser(user.id)); });
    } else {
      cb(getAttemptsForUser(user.id));
    }
  }

  function getAttemptsForUser(uid) {
    return getAttemptsFromStorage().filter(function(a) { return a.userId === uid; });
  }

  function canAttempt(quizId, attemptsList) {
    const attempts = attemptsList || getAttemptsForUser(user.id);
    const a = attempts.find(function(x) { return x.quizId === quizId; });
    if (!a) return { allowed: true };
    if (a.blocked) return { allowed: false, reason: 'blocked' };
    if (a.submittedAt) return { allowed: false, reason: 'already_submitted' };
    return { allowed: true };
  }

  const listEl = document.getElementById('quizzesList');
  loadQuizzes(function(quizzes) {
    loadAttempts(function(attempts) {
      if (!quizzes.length) {
        listEl.innerHTML = '<p style="color: var(--text-muted);">No quizzes available.</p>';
        return;
      }
      listEl.innerHTML = quizzes.map(function(q) {
        const status = canAttempt(q.id, attempts);
        const timeStr = Math.floor((q.timeLimitSeconds || 0) / 60) + ' min';
        let btn = '';
        if (status.allowed) {
          btn = '<a href="quiz.html?id=' + encodeURIComponent(q.id) + '" class="btn btn-primary" style="text-decoration:none;">Start Quiz</a>';
        } else if (status.reason === 'blocked') {
          btn = '<span class="text-danger">Blocked</span>';
        } else {
          btn = '<span style="color: var(--text-muted);">Already attempted</span>';
        }
        return '<div class="card mt-2" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">' +
          '<div><strong>' + escapeHtml(q.title) + '</strong><br><small style="color: var(--text-muted);">' + (q.questions ? q.questions.length : 0) + ' questions · ' + timeStr + '</small></div>' +
          '<div>' + btn + '</div></div>';
      }).join('');
    });
  });

  function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
