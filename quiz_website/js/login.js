(function() {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('errorMsg');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  function hideError() {
    errorEl.classList.add('hidden');
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const regNo = document.getElementById('regNo').value.trim();

    const errors = getValidationErrors(fullName, email, regNo);
    if (errors.length) {
      showError(errors.join(' '));
      return;
    }

    if (typeof firebase === 'undefined' || !window.db) {
      // No Firebase: use localStorage for demo
      let users = [];
      try { users = JSON.parse(localStorage.getItem('quiz_website_users') || '[]'); } catch (_) {}
      let existing = users.find(function(u) { return u.email === email && (u.regNo || '').toUpperCase() === regNo.toUpperCase(); });
      const uid = existing ? existing.id : 'local-' + Date.now();
      const user = { id: uid, fullName, email, regNo: regNo.toUpperCase() };
      if (!existing) { users.push(user); localStorage.setItem('quiz_website_users', JSON.stringify(users)); }
      sessionStorage.setItem('quiz_user', JSON.stringify(user));
      window.location.href = 'user-dashboard.html';
      return;
    }

    try {
      const usersRef = db.collection('users');
      const snap = await usersRef.where('email', '==', email).where('regNo', '==', regNo.toUpperCase()).limit(1).get();
      let userId;
      if (snap.empty) {
        const doc = await usersRef.add({
          fullName,
          email,
          regNo: regNo.toUpperCase(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        userId = doc.id;
      } else {
        userId = snap.docs[0].id;
        await usersRef.doc(userId).update({ fullName });
      }
      const user = { id: userId, fullName, email, regNo: regNo.toUpperCase() };
      sessionStorage.setItem('quiz_user', JSON.stringify(user));
      window.location.href = 'user-dashboard.html';
    } catch (err) {
      showError('Login failed. Please try again.');
      console.error(err);
    }
  });
})();
