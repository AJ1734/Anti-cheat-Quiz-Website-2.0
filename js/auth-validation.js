// Email must end with @vitapstudent.ac.in
const EMAIL_DOMAIN = '@vitapstudent.ac.in';
const EMAIL_REGEX = /^[^@]+@vitapstudent\.ac\.in$/i;

// Registration: 2 + one digit + exactly 3 letters + 4 or 5 digits
const REG_NO_REGEX = /^2[0-9][A-Za-z]{3}[0-9]{4,5}$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return trimmed.endsWith(EMAIL_DOMAIN) && EMAIL_REGEX.test(trimmed);
}

function validateRegNo(regNo) {
  if (!regNo || typeof regNo !== 'string') return false;
  return REG_NO_REGEX.test(regNo.trim());
}

function getValidationErrors(fullName, email, regNo) {
  const errors = [];
  if (!fullName || fullName.trim().length < 2) errors.push('Enter a valid full name.');
  if (!validateEmail(email)) errors.push('Email must end with @vitapstudent.ac.in');
  if (!validateRegNo(regNo)) errors.push('Registration number must match pattern (e.g. 23BCE7372, 23BEC20195).');
  return errors;
}
