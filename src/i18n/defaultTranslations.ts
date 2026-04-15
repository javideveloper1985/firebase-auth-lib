/**
 * Default English translations for all keys used by expo-firebase-auth.
 *
 * Override any or all of these by passing a `translate` function to
 * `AuthProvider`. Your function receives the key and should return the
 * translated string.
 */
export const defaultTranslations: Record<string, string> = {
  // Hooks
  'hooks.useAuthProviderRequired': 'useAuth must be used inside an AuthProvider.',

  // Generic errors
  'errors.firebaseCodePrefix': 'Firebase code:',
  'errors.firestoreUsersProfilesRulesHint':
    'Check Firestore user/profile rules if the problem persists.',

  // Login / logout
  'auth.loginGenericError': 'Could not log in. Please try again.',
  'auth.logoutGenericError': 'Could not log out. Please try again.',
  'auth.invalidCredentialsTitle': 'Invalid credentials',
  'auth.invalidCredentialsDescription': 'Email or password is incorrect.',
  'auth.invalidEmailTitle': 'Invalid email',
  'auth.invalidEmailDescription': 'Please enter a valid email address.',
  'auth.emailPendingTitle': 'Verify your email',
  'auth.emailPendingDescription':
    'We sent you a verification email. Please check your inbox before logging in.',

  // Google auth
  'auth.googleLoginErrorTitle': 'Google sign-in error',
  'auth.googleLoginGenericError': 'Could not sign in with Google. Please try again.',
  'auth.googleMissingToken': 'Google authentication token is missing.',
  'auth.googleCanceled': 'Google sign-in was cancelled.',
  'auth.checkConnectionAndTryAgain':
    'Check your internet connection and try again.',
  'auth.googleConfigIncompleteTitle': 'Google config incomplete',
  'auth.googleConfigMissingRedirect':
    'Redirect scheme is not configured. Check your app.json.',
  'auth.googleConfigMissingOwnerSlug':
    'Expo owner and slug are required when running in Expo Go.',
  'auth.googleConfigReview':
    'One or more Google client IDs are missing. Review your environment variables.',
  'auth.googleValidateAccountError': 'Could not validate your Google account.',
  'auth.googleAuthIncomplete': 'Google authentication did not complete.',

  // Password reset
  'auth.enterEmailTitle': 'Enter your email',
  'auth.enterEmailDescription': 'Please enter your email address to reset your password.',
  'auth.checkEmailTitle': 'Check your inbox',
  'auth.checkEmailDescription': 'We sent a password-reset link to your email.',
  'auth.userNotFoundTitle': 'Account not found',
  'auth.userNotFoundDescription': 'No account found with that email address.',
  'auth.sendRecoveryEmailWithCodeTitle': 'Could not send recovery email',
  'auth.sendRecoveryError': 'Could not send recovery email. Please try again.',

  // Registration
  'auth.checkVerificationEmailDescription':
    'We sent a verification email. Please verify before signing in.',
  'auth.verificationNotSentTitle': 'Verification email not sent',
  'auth.verificationNotSentDescription':
    'Your account was created but the verification email could not be sent.',
  'auth.emailInUseTitle': 'Email already in use',
  'auth.emailInUseDescriptionRegistered':
    'An account already exists with this email. Try signing in.',
  'auth.emailInUseDescriptionLinked':
    'This email is linked to another sign-in method.',
  'auth.createUserGenericError': 'Could not create account. Please try again.',

  // Account deletion
  'auth.noActiveSessionTitle': 'No active session',
  'auth.noActiveSessionDescription': 'You must be logged in to delete your account.',
  'auth.protectedActionTitle': 'Re-authentication required',
  'auth.protectedActionDescription':
    'Please log out, sign in again, then retry this action.',
  'account.deleteTitle': 'Delete account',
  'auth.deleteAccountErrorDescription':
    'Could not delete your account. Please try again.',

  // Profile setup error (injected via onPostLoginSetup)
  'profile.defaultProfileCreateError': 'Could not set up your profile.',
  'auth.profileLoadErrorTitle': 'Could not load profile',

  // useLogin
  'auth.loggingIn': 'Logging in…',
  'auth.connectingWithGoogle': 'Connecting with Google…',
  'auth.connectingWithFacebook': 'Connecting with Facebook…',
  'auth.processingLogin': 'Processing…',
  'auth.optionNotAvailable': 'This option is not available yet.',

  // Validation
  'validation.auth.nameRequired': 'Name is required.',
  'validation.auth.nameTooShort': 'Name must be at least 2 characters.',
  'validation.auth.emailRequired': 'Email is required.',
  'validation.auth.emailInvalid': 'Enter a valid email address.',
  'validation.auth.passwordRequired': 'Password is required.',
  'validation.auth.passwordMinLength': 'Password must be at least 8 characters.',

  // common
  'common.tryAgain': 'Please try again.',
  'common.tryAgainInSeconds': 'Please try again in a few seconds.',
  'common.or': 'or',
}

export const defaultTranslate = (key: string): string =>
  defaultTranslations[key] ?? key
