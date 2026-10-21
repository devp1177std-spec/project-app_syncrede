/**
 * Maps Firebase Auth error codes to user-friendly error messages.
 */
export function formatFirebaseAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code: string = error?.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Invalid Firebase API key. Please check your NEXT_PUBLIC_FIREBASE_API_KEY in .env.';
    case 'auth/configuration-not-found':
      return 'Firebase project configuration not found. Please verify your project settings.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your credentials or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or click "Forgot password?".';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your details.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password (at least 8 characters).';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled before completion.';
    case 'auth/popup-blocked':
      return 'Sign in popup was blocked by your browser. Please enable popups and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase sign-in. Check Firebase Console authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled. Please enable it in Firebase Console.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access has been temporarily disabled. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    case 'auth/requires-recent-login':
      return 'Please log in again before performing this sensitive action.';
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid or has already been used.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}
