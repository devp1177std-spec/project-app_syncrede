import test from 'node:test';
import assert from 'node:assert';
import { formatFirebaseAuthError } from './errors.ts';

test('formatFirebaseAuthError returns friendly message for invalid credential', () => {
  const msg = formatFirebaseAuthError({ code: 'auth/invalid-credential' });
  assert.strictEqual(msg, 'Invalid email or password. Please verify your details.');
});

test('formatFirebaseAuthError returns friendly message for email already in use', () => {
  const msg = formatFirebaseAuthError({ code: 'auth/email-already-in-use' });
  assert.strictEqual(
    msg,
    'An account with this email already exists. Try logging in instead.',
  );
});

test('formatFirebaseAuthError returns friendly message for weak password', () => {
  const msg = formatFirebaseAuthError({ code: 'auth/weak-password' });
  assert.strictEqual(
    msg,
    'Password is too weak. Please choose a stronger password (at least 8 characters).',
  );
});

test('formatFirebaseAuthError returns friendly message for popup closed by user', () => {
  const msg = formatFirebaseAuthError({ code: 'auth/popup-closed-by-user' });
  assert.strictEqual(msg, 'Sign in was cancelled before completion.');
});

test('formatFirebaseAuthError returns friendly message for unauthorized domain', () => {
  const msg = formatFirebaseAuthError({ code: 'auth/unauthorized-domain' });
  assert.strictEqual(
    msg,
    'This domain is not authorized for Firebase sign-in. Check Firebase Console authorized domains.',
  );
});

test('formatFirebaseAuthError handles fallback for unknown errors', () => {
  const msg = formatFirebaseAuthError({ message: 'Custom server error' });
  assert.strictEqual(msg, 'Custom server error');
});

test('formatFirebaseAuthError handles empty or null errors', () => {
  const msg = formatFirebaseAuthError(null);
  assert.strictEqual(msg, 'An unexpected error occurred. Please try again.');
});
