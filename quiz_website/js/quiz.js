(function() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const quizId = params.get('id');
  if (!quizId) {
    window.location.href = 'user-dashboard.html';
    return;
  }

  let quiz = null;
  let attemptId = null;
  let attemptDocId = null;
  let currentAttempt = null;
  let timerInterval = null;
  let endTime = null;

  function getAttempts() {
    return getAttemptsFromStorage();
  }

  function saveAttempts(attempts) {
    saveAttemptsToStorage(attempts);
  }

  function findAttempt() {
    return currentAttempt || getAttempts().find(function(a) { return a.quizId === quizId && a.userId === user.id; });
  }

  function redirectBlocked() {
    if (timerInterval) clearInterval(timerInterval);
    window.location.href = 'blocked.html?quizId=' + encodeURIComponent(quizId);
  }

  function terminateQuiz() {
    const answers = collectAnswers();
    const startedAt = findAttempt() ? findAttempt().startedAt : Date.now();
    const record = {
      userId: user.id,
      quizId: quizId,
      userName: user.fullName,
      userEmail: user.email,
      regNo: user.regNo || '',
      startedAt: startedAt,
      submittedAt: Date.now(),
      answers: answers,
      blocked: true,
      score: 0
    };
    if (window.db && attemptDocId) {
      window.db.collection('attempts').doc(attemptDocId).set(record).then(redirectBlocked);
    } else {
      const attempts = getAttempts();
      const existing = attempts.findIndex(function(a) { return a.quizId === quizId && a.userId === user.id; });
      if (existing >= 0) attempts[existing] = record; else attempts.push(record);
      saveAttempts(attempts);
      redirectBlocked();
    }
  }

  function loadQuiz(cb) {
    if (window.db) {
      window.db.collection('quizzes').doc(quizId).get().then(function(doc) {
        if (doc.exists) { var d = doc.data(); d.id = doc.id; cb(d); } else cb(null);
      }).catch(function() { loadQuizLocal(cb); });
    } else {
      loadQuizLocal(cb);
    }
  }

  function loadQuizLocal(cb) {
    const q = getQuizzesFromStorage().find(function(x) { return x.id === quizId; });
    cb(q || null);
  }

  function collectAnswers() {
    const out = [];
    var blocks = document.querySelectorAll('#questionsWrap .card[data-question-index]');
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var idx = parseInt(block.getAttribute('data-question-index'), 10);
      var selected = block.querySelector('input:checked');
      out[idx] = selected ? selected.value : null;
    }
    return out;
  }

  function computeScore() {
    if (!quiz || !quiz.questions) return 0;
    const answers = collectAnswers();
    let correct = 0;
    quiz.questions.forEach(function(q, i) {
      const optIdx = answers[i];
      if (optIdx != null && q.options[parseInt(optIdx, 10)] && q.options[parseInt(optIdx, 10)].isCorrect) correct++;
    });
    return correct;
  }

  function submitQuiz() {
    if (timerInterval) clearInterval(timerInterval);
    const answers = collectAnswers();
    const score = computeScore();
    const startedAt = findAttempt() ? findAttempt().startedAt : Date.now();
    const record = {
      userId: user.id,
      quizId: quizId,
      userName: user.fullName,
      userEmail: user.email,
      regNo: user.regNo || '',
      startedAt: startedAt,
      submittedAt: Date.now(),
      answers: answers,
      score: score,
      blocked: false
    };
    if (window.db && attemptDocId) {
      window.db.collection('attempts').doc(attemptDocId).set(record).then(function() {
        window.location.href = 'user-dashboard.html?submitted=1';
      });
    } else {
      const attempts = getAttempts();
      const existing = attempts.findIndex(function(a) { return a.quizId === quizId && a.userId === user.id; });
      if (existing >= 0) attempts[existing] = record; else attempts.push(record);
      saveAttempts(attempts);
      window.location.href = 'user-dashboard.html?submitted=1';
    }
  }

  function renderTimer() {
    const el = document.getElementById('quizTimer');
    if (!endTime || !el) return;
    function update() {
      const now = Date.now();
      if (now >= endTime) {
        clearInterval(timerInterval);
        submitQuiz();
        return;
      }
      const sec = Math.ceil((endTime - now) / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      el.classList.remove('warning', 'danger');
      if (sec <= 60) el.classList.add('danger');
      else if (sec <= 180) el.classList.add('warning');
    }
    update();
    timerInterval = setInterval(update, 500);
  }

  function renderQuestions() {
    const wrap = document.getElementById('questionsWrap');
    const questions = quiz.questions || [];
    wrap.innerHTML = questions.map(function(q, i) {
      const opts = (q.options || []).map(function(opt, j) {
        return '<label class="quiz-option"><input type="radio" name="q' + i + '" value="' + j + '" data-question-index="' + i + '"> ' + escapeHtml(opt.text) + '</label>';
      }).join('');
      return '<div class="card mt-2" data-question-index="' + i + '"><h3 style="margin-bottom:0.75rem;">' + (i + 1) + '. ' + escapeHtml(q.text) + '</h3>' + opts + '</div>';
    }).join('');
    wrap.classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
  }

  function escapeHtml(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function startQuiz(q) {
    quiz = q;
    document.getElementById('quizTitle').textContent = q.title || 'Quiz';
    const limit = (q.timeLimitSeconds || 0) * 1000;

    function toMs(v) {
      if (v && typeof v.toMillis === 'function') return v.toMillis();
      return typeof v === 'number' ? v : Date.now();
    }

    function proceed(existingAttempt) {
      currentAttempt = existingAttempt || null;
      if (existingAttempt && existingAttempt.blocked) {
        redirectBlocked();
        return;
      }
      if (existingAttempt && existingAttempt.submittedAt) {
        window.location.href = 'user-dashboard.html';
        return;
      }
      var startedAt = existingAttempt ? toMs(existingAttempt.startedAt) : Date.now();
      if (!existingAttempt && window.db) {
        window.db.collection('attempts').add({
          userId: user.id,
          quizId: quizId,
          userName: user.fullName,
          userEmail: user.email,
          regNo: user.regNo || '',
          startedAt: startedAt,
          submittedAt: null,
          answers: [],
          blocked: false
        }).then(function(ref) {
          attemptDocId = ref.id;
          currentAttempt = { startedAt: startedAt };
          endTime = startedAt + limit;
          renderQuestions();
          renderTimer();
        }).catch(function() {
          endTime = Date.now() + limit;
          renderQuestions();
          renderTimer();
        });
      } else if (!existingAttempt) {
        const attempts = getAttempts();
        attemptId = 'att-' + Date.now();
        attempts.push({
          id: attemptId,
          userId: user.id,
          quizId: quizId,
          userName: user.fullName,
          userEmail: user.email,
          regNo: user.regNo || '',
          startedAt: startedAt,
          submittedAt: null,
          answers: [],
          blocked: false
        });
        saveAttempts(attempts);
        endTime = startedAt + limit;
        renderQuestions();
        renderTimer();
      } else {
        if (existingAttempt.id) attemptDocId = existingAttempt.id;
        endTime = startedAt + limit;
        renderQuestions();
        renderTimer();
      }
    }

    if (window.db) {
      window.db.collection('attempts').where('userId', '==', user.id).where('quizId', '==', quizId).limit(1).get()
        .then(function(snap) {
          var att = snap.empty ? null : (function() { var d = snap.docs[0]; var x = d.data(); x.id = d.id; return x; })();
          proceed(att);
        })
        .catch(function() { proceed(null); });
    } else {
      var existing = getAttempts().find(function(a) { return a.quizId === quizId && a.userId === user.id; });
      proceed(existing);
    }
  }

  QuizAntiCheat.init(terminateQuiz);

  loadQuiz(function(q) {
    if (!q) {
      document.getElementById('loading').textContent = 'Quiz not found.';
      setTimeout(function() { window.location.href = 'user-dashboard.html'; }, 2000);
      return;
    }
    startQuiz(q);
  });

  document.getElementById('submitQuizBtn').addEventListener('click', function() {
    if (confirm('Submit your answers?')) submitQuiz();
  });

  var modalOk = document.getElementById('modalOk');
  if (modalOk) modalOk.addEventListener('click', function() {
    document.getElementById('modalOverlay').classList.add('hidden');
    if (window.QuizAntiCheat && window.QuizAntiCheat.setModalClosed) window.QuizAntiCheat.setModalClosed();
  });
})();
