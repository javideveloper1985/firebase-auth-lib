// ─── Context & hook ───────────────────────────────────────────────────────────
export { AuthProvider, useAuth } from './context/AuthContext'

// ─── Hooks ────────────────────────────────────────────────────────────────────
export {
  useAuthIdentityFlow,
  type AuthIdentityFormData,
  type AuthIdentityMode,
  type UseAuthIdentityFlowResult,
} from './hooks/useAuthIdentityFlow'

export {
  useEmailPasswordAuth,
  type EmailPasswordFormData,
  type UseEmailPasswordAuthResult,
} from './hooks/useEmailPasswordAuth'

export {
  useGoogleAuth,
  type UseGoogleAuthConfig,
  type UseGoogleAuthResult,
} from './hooks/useGoogleAuth'

export {
  useLogin,
  type UseLoginOptions,
  type UseLoginResult,
} from './hooks/useLogin'

// ─── Services ─────────────────────────────────────────────────────────────────
export {
  saveLastAuthFormIdentity,
  loadLastAuthFormIdentity,
  AUTH_FORM_STORAGE_KEY,
  type AuthFormIdentity,
} from './services/authFormStorage'

// ─── Validation ───────────────────────────────────────────────────────────────
export { UserSchema } from './validation/schemas'

// ─── Config factory ───────────────────────────────────────────────────────────
export {
  createFirebaseAuth,
  resetFirebaseAuthSingleton,
} from './config/createFirebaseAuth'

// ─── Assets ───────────────────────────────────────────────────────────────────
export { default as GoogleIcon } from './assets/GoogleIcon'
export { default as FacebookIcon } from './assets/FacebookIcon'

// ─── i18n ─────────────────────────────────────────────────────────────────────
export { defaultTranslations, defaultTranslate } from './i18n/defaultTranslations'

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AppAuthType,
  AuthContextType,
  AuthProviderConfig,
  FirebaseConfig,
  ShowErrorFn,
  ShowInfoFn,
  TrackErrorFn,
  TranslateFn,
  OnPostLoginSetupFn,
  OnDeleteAccountFn,
  AlertOptions,
  StoredSession,
  VerificationEmailResult,
} from './types'
