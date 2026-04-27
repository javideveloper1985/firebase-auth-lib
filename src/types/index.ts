import type { User } from 'firebase/auth'

// ─── Firebase config ────────────────────────────────────────────────────────

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  databaseURL?: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
  measurementId?: string
}

// ─── Notification callbacks ──────────────────────────────────────────────────

export interface AlertOptions {
  durationMs?: number
}

export type ShowErrorFn = (message: string, description?: string, options?: AlertOptions) => void
export type ShowInfoFn = (message: string, description?: string, options?: AlertOptions) => void

// ─── Error tracking ──────────────────────────────────────────────────────────

export type TrackErrorFn = (error: unknown, meta: Record<string, unknown>) => void

// ─── Translation ─────────────────────────────────────────────────────────────

export type TranslateFn = (key: string) => string

// ─── Google OAuth config ─────────────────────────────────────────────────────

/**
 * Google OAuth configuration.
 * 
 * ⚠️ IMPORTANT: Pass these values from your app code, NOT from library defaults.
 * In production builds, process.env variables are only replaced in your app code,
 * not inside node_modules.
 */
export interface GoogleAuthConfig {
  /**
   * Google OAuth web client ID (required for Firebase Auth on all platforms).
   * Get this from Google Cloud Console → APIs & Services → Credentials.
   */
  webClientId?: string
  /**
   * Android OAuth client ID (required for native Android builds).
   * Only needed for standalone APK builds, not for Expo Go or web.
   */
  androidClientId?: string
  /**
   * iOS OAuth client ID (required for native iOS builds).
   * Only needed for standalone iOS builds, not for Expo Go or web.
   */
  iosClientId?: string
}

// ─── Post-auth lifecycle callbacks ───────────────────────────────────────────

/**
 * Called after a user successfully authenticates (login, google login, or
 * session restore). Use this to run app-specific setup such as syncing quotas
 * or ensuring default profiles.
 *
 * @param user           The authenticated Firebase user.
 * @param pendingName    Display name provided during registration (if any).
 */
export type OnPostLoginSetupFn = (
  user: User,
  pendingName?: string | null,
) => Promise<void>

/**
 * Called during account deletion, before the Firebase user is removed.
 * Use this to clean up app-specific data (e.g. Firestore user profile).
 */
export type OnDeleteAccountFn = (userId: string) => Promise<void>

// ─── AuthProvider config ─────────────────────────────────────────────────────

export interface AuthProviderConfig {
  /** Firebase project configuration. */
  firebaseConfig: FirebaseConfig

  /**
   * Google OAuth configuration.
   * 
   * ⚠️ BEST PRACTICE: Pass these explicitly from your app code:
   * ```typescript
   * googleConfig: {
   *   webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
   *   androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
   *   iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
   * }
   * ```
   * 
   * This ensures environment variables are replaced during build time.
   */
  googleConfig?: GoogleAuthConfig

  /**
   * AsyncStorage key used to persist session metadata.
   * @default 'auth:user-session'
   */
  sessionKey?: string

  /**
   * Number of inactive days before a restored session is considered expired.
   * @default 7
   */
  inactivityLimitDays?: number

  /**
   * Translation function. Called with a dot-notation key string.
   * Falls back to built-in English strings when omitted.
   */
  translate?: TranslateFn

  /** Display an error notification to the user. */
  showError?: ShowErrorFn

  /** Display an informational notification to the user. */
  showInfo?: ShowInfoFn

  /** Report non-fatal errors to your observability platform. */
  trackError?: TrackErrorFn

  /**
   * App-specific setup run after every successful authentication
   * (new login, google sign-in, or session restore).
   */
  onPostLoginSetup?: OnPostLoginSetupFn

  /**
   * App-specific cleanup run before the Firebase user account is deleted.
   */
  onDeleteAccount?: OnDeleteAccountFn
}

// ─── Auth context ─────────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null
  loading: boolean

  login: (email: string, password: string) => Promise<string | null>
  loginWithGoogle: (idToken?: string, accessToken?: string) => Promise<string | null>
  logout: () => Promise<boolean>
  createAccount: (name: string, email: string, password: string) => Promise<string | null>
  resetPassword: (email: string) => Promise<boolean>
  deleteCurrentAccount: () => Promise<boolean>

  /** Injected translation function (or built-in default). */
  translate: TranslateFn
  /** Injected error notification function (or no-op). */
  showError: ShowErrorFn
  /** Injected info notification function (or no-op). */
  showInfo: ShowInfoFn
  /** Injected error tracker (or no-op). */
  trackError: TrackErrorFn
  /** Google OAuth configuration (if provided via AuthProvider config). */
  googleConfig?: GoogleAuthConfig
}

// ─── Stored session ───────────────────────────────────────────────────────────

export interface StoredSession {
  email: string
  lastAccessAt: string
}

// ─── Verification result ──────────────────────────────────────────────────────

export interface VerificationEmailResult {
  sent: boolean
  errorCode?: string
}

// ─── Auth type ────────────────────────────────────────────────────────────────

export type AppAuthType = 'Google' | 'Facebook' | 'UserPass'
