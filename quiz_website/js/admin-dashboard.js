(function() {
  if (!isAdmin()) {
    window.location.href = 'admin-login.html';
    return;
  }

  let questionIndex = 0;
  let quizzesCache = [];
  let attemptsCache = [];

  function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const qId = 'q' + questionIndex++;
    const div = document.createElement('div');
    div.className = 'card mt-2';
    div.dataset.qid = qId;
    div.innerHTML = '<h3 style="margin-bottom: 0.75rem;">Question ' + (container.children.length + 1) + '</h3>' +
      '<div class="form-group"><label>Question text</label><textarea class="q-text" rows="2" placeholder="Enter question"></textarea></div>' +
      '<div class="options-wrap"></div>' +
      '<button type="button" class="btn btn-secondary add-option mt-1">+ Add option</button>' +
      '<button type="button" class="btn btn-secondary remove-q mt-1" style="margin-left: 0.5rem;">Remove question</button>';
    container.appendChild(div);

    const optsWrap = div.querySelector('.options-wrap');
    const addOpt = div.querySelector('.add-option');
    function addOptRow() {
      const r = document.createElement('div');
      r.className = 'form-group';
      r.style.display = 'flex';
      r.style.gap = '0.5rem';
      r.style.alignItems = 'center';
      r.innerHTML = '<input type="text" class="opt-text" placeholder="Option text" style="flex:1">' +
        '<label style="display:flex;align-items:center;margin:0;"><input type="radio" name="correct_' + qId + '" class="opt-correct"> Correct</label>' +
        '<button type="button" class="btn btn-secondary remove-opt">×</button>';
      optsWrap.appendChild(r);
      r.querySelector('.remove-opt').onclick = function() { r.remove(); };
    }
    addOpt.onclick = addOptRow;
    addOptRow();
    addOptRow();

    div.querySelector('.remove-q').onclick = function() { div.remove(); };
  }

  document.getElementById('addQuestionBtn').onclick = addQuestion;

  document.getElementById('saveQuizBtn').onclick = function() {
    const title = document.getElementById('quizTitle').value.trim();
    const minutes = parseInt(document.getElementById('quizMinutes').value, 10) || 0;
    const seconds = parseInt(document.getElementById('quizSeconds').value, 10) || 0;
    const timeLimitSeconds = minutes * 60 + seconds;

    if (!title) {
      alert('Enter a quiz title.');
      return;
    }

    const qCont = document.getElementById('questionsContainer');
    const questions = [];
    for (let i = 0; i < qCont.children.length; i++) {
      const qDiv = qCont.children[i];
      const text = (qDiv.querySelector('.q-text') || {}).value || '';
      const optDivs = qDiv.querySelectorAll('.options-wrap .form-group');
      const options = [];
      let hasCorrect = false;
      optDivs.forEach(function(od) {
        const t = (od.querySelector('.opt-text') || {}).value || '';
        const correct = (od.querySelector('.opt-correct') || {}).checked;
        if (t) { options.push({ text: t, isCorrect: correct }); if (correct) hasCorrect = true; }
      });
      if (text && options.length >= 2 && hasCorrect) {
        questions.push({ text, options });
      }
    }
    if (questions.length === 0) {
      alert('Add at least one question with 2+ options and one correct answer.');
      return;
    }

    const quiz = { title, timeLimitSeconds, questions, createdAt: Date.now() };

    if (window.db) {
      quiz.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      window.db.collection('quizzes').add(quiz).then(function(ref) {
        quiz.id = ref.id;
        quizzesCache.push(quiz);
        document.getElementById('quizTitle').value = '';
        document.getElementById('quizMinutes').value = '10';
        document.getElementById('quizSeconds').value = '0';
        while (qCont.firstChild) qCont.removeChild(qCont.firstChild);
        questionIndex = 0;
        renderQuizzes();
        renderAttempts();
        renderQuizFilter();
      }).catch(function(err) {
        alert('Failed to save quiz.');
        console.error(err);
      });
    } else {
      const quizzes = getQuizzesFromStorage();
      quiz.id = 'quiz-' + Date.now();
      quiz.createdAt = Date.now();
      quizzes.push(quiz);
      saveQuizzesToStorage(quizzes);
      document.getElementById('quizTitle').value = '';
      document.getElementById('quizMinutes').value = '10';
      document.getElementById('quizSeconds').value = '0';
      while (qCont.firstChild) qCont.removeChild(qCont.firstChild);
      questionIndex = 0;
      renderQuizzes();
      renderAttempts();
      renderQuizFilter();
    }
  };

  function getQuizzes() { return window.db ? quizzesCache : getQuizzesFromStorage(); }
  function getAttempts() { return window.db ? attemptsCache : getAttemptsFromStorage(); }

  function renderQuizzes() {
    const list = document.getElementById('quizzesList');
    const quizzes = getQuizzes();
    if (!quizzes.length) {
      list.innerHTML = '<p style="color: var(--text-muted);">No quizzes yet. Create one above.</p>';
      return;
    }
    list.innerHTML = quizzes.map(function(q) {
      const min = Math.floor((q.timeLimitSeconds || 0) / 60);
      const sec = (q.timeLimitSeconds || 0) % 60;
      return '<div class="card mt-1" style="margin-top: 0.5rem;"><strong>' + escapeHtml(q.title) + '</strong> — ' + (q.questions ? q.questions.length : 0) + ' questions, ' + min + 'm ' + sec + 's</div>';
    }).join('');
  }

  function renderQuizFilter() {
    const sel = document.getElementById('filterQuiz');
    const quizzes = getQuizzes();
    sel.innerHTML = '<option value="">All quizzes</option>' + quizzes.map(function(q) {
      return '<option value="' + escapeHtml(q.id) + '">' + escapeHtml(q.title) + '</option>';
    }).join('');
  }

  function renderAttempts() {
    const list = document.getElementById('attemptsList');
    const quizId = document.getElementById('filterQuiz').value;
    let attempts = getAttempts();
    if (quizId) attempts = attempts.filter(function(a) { return a.quizId === quizId; });
    const users = getUsersFromStorage();
    const userMap = {};
    users.forEach(function(u) { userMap[u.id] = u; });

    if (!attempts.length) {
      list.innerHTML = '<p style="color: var(--text-muted);">No attempts yet.</p>';
      return;
    }
    list.innerHTML = attempts.map(function(a) {
      const u = userMap[a.userId] || {};
      const name = u.fullName || a.userName || a.userId;
      const email = u.email || a.userEmail || '';
      const blocked = a.blocked ? ' <span class="text-danger">(Blocked)</span>' : '';
      return '<div class="card mt-1" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">' +
        '<div><strong>' + escapeHtml(name) + '</strong> ' + escapeHtml(email) + blocked + '<br><small style="color: var(--text-muted);">' + (a.submittedAt ? 'Submitted' : 'In progress') + '</small></div>' +
        '<button type="button" class="btn btn-secondary reset-attempt-btn" data-user-id="' + escapeHtml(a.userId) + '" data-quiz-id="' + escapeHtml(a.quizId) + '">Reset attempt</button></div>';
    }).join('');

    list.querySelectorAll('.reset-attempt-btn').forEach(function(btn) {
      btn.onclick = function() {
        const userId = btn.dataset.userId;
        const qId = btn.dataset.quizId;
        if (window.db) {
          window.db.collection('attempts').where('userId', '==', userId).where('quizId', '==', qId).get().then(function(snap) {
            snap.docs.forEach(function(d) { d.ref.delete(); });
            attemptsCache = attemptsCache.filter(function(a) { return !(a.userId === userId && a.quizId === qId); });
            renderAttempts();
          });
        } else {
          let attempts = getAttemptsFromStorage();
          attempts = attempts.filter(function(a) { return !(a.userId === userId && a.quizId === qId); });
          saveAttemptsToStorage(attempts);
          renderAttempts();
        }
      };
    });
  }

  function escapeHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  document.getElementById('filterQuiz').addEventListener('change', function() {
    var sel = document.getElementById('downloadExcelBtn');
    if (sel) sel.style.display = document.getElementById('filterQuiz').value ? 'inline-flex' : 'none';
    renderAttempts();
  });

  function formatTimestamp(ts) {
    if (!ts) return '';
    var d = ts;
    if (ts && typeof ts.toDate === 'function') d = ts.toDate();
    if (ts && typeof ts.toMillis === 'function') d = new Date(ts.toMillis());
    if (d instanceof Date && !isNaN(d)) return d.toLocaleString();
    if (typeof ts === 'number') return new Date(ts).toLocaleString();
    return String(ts);
  }

  function downloadQuizResultsExcel() {
    var quizId = document.getElementById('filterQuiz').value;
    if (!quizId) return;
    var quizzes = getQuizzes();
    var quiz = quizzes.find(function(q) { return q.id === quizId; });
    var attempts = getAttempts().filter(function(a) { return a.quizId === quizId; });
    if (!attempts.length) {
      alert('No attempts to export for this quiz.');
      return;
    }
    var totalQuestions = (quiz && quiz.questions) ? quiz.questions.length : 0;
    var headers = ['Full Name', 'Email', 'Registration Number', 'Score', 'Total Questions', 'Percentage (%)', 'Submitted At', 'Blocked'];
    var i;
    for (i = 0; i < totalQuestions; i++) headers.push('Q' + (i + 1) + ' Answer');
    var rows = attempts.map(function(a) {
      var score = typeof a.score === 'number' ? a.score : 0;
      var pct = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : '0';
      var r = [
        a.userName || '',
        a.userEmail || '',
        (a.regNo || '').toString(),
        score,
        totalQuestions,
        pct,
        formatTimestamp(a.submittedAt),
        a.blocked ? 'Yes' : 'No'
      ];
      for (i = 0; i < totalQuestions; i++) {
        var ans = (a.answers && a.answers[i] != null) ? a.answers[i] : '';
        var optText = '';
        if (quiz && quiz.questions && quiz.questions[i] && quiz.questions[i].options) {
          var idx = parseInt(ans, 10);
          if (!isNaN(idx) && quiz.questions[i].options[idx]) optText = quiz.questions[i].options[idx].text || '';
          else if (ans !== '') optText = String(ans);
        } else if (ans !== '') optText = String(ans);
        r.push(optText);
      }
      return r;
    });
    var wsData = [headers].concat(rows);
    var wb = typeof XLSX !== 'undefined' ? XLSX.utils.book_new() : null;
    if (!wb) {
      alert('Excel library not loaded. Please refresh the page.');
      return;
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var safeTitle = (quiz && quiz.title) ? String(quiz.title).replace(/[/\\?*\[\]:]/g, '-').slice(0, 31) : 'QuizResults';
    XLSX.utils.book_append_sheet(wb, ws, safeTitle);
    var fileName = safeTitle + '_results_' + new Date().toISOString().slice(0, 10) + '.xlsx';
    XLSX.writeFile(wb, fileName);
  }

  var excelBtn = document.getElementById('downloadExcelBtn');
  if (excelBtn) excelBtn.addEventListener('click', downloadQuizResultsExcel);

  function loadData() {
    if (window.db) {
      window.db.collection('quizzes').orderBy('createdAt', 'desc').get().then(function(snap) {
        quizzesCache = snap.docs.map(function(d) { var x = d.data(); x.id = d.id; return x; });
        return window.db.collection('attempts').get();
      }).then(function(snap) {
        attemptsCache = snap.docs.map(function(d) { var x = d.data(); x.id = d.id; return x; });
        addQuestion();
        renderQuizzes();
        renderQuizFilter();
        renderAttempts();
        var eb = document.getElementById('downloadExcelBtn');
        if (eb) eb.style.display = document.getElementById('filterQuiz').value ? 'inline-flex' : 'none';
      }).catch(function() {
        addQuestion();
        renderQuizzes();
        renderQuizFilter();
        renderAttempts();
      });
    } else {
      addQuestion();
      renderQuizzes();
      renderQuizFilter();
      renderAttempts();
      var eb = document.getElementById('downloadExcelBtn');
      if (eb) eb.style.display = document.getElementById('filterQuiz').value ? 'inline-flex' : 'none';
    }
  }

  loadData();
})();
