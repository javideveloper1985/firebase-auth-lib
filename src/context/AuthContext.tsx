import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  updateProfile,
  type User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { createFirebaseAuth } from '../config/createFirebaseAuth'
import { defaultTranslate } from '../i18n/defaultTranslations'
import type {
  AuthContextType,
  AuthProviderConfig,
  StoredSession,
  VerificationEmailResult,
  ShowErrorFn,
  ShowInfoFn,
  TrackErrorFn,
  TranslateFn,
} from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SESSION_KEY = 'auth:user-session'
const DEFAULT_INACTIVITY_DAYS = 7

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error(defaultTranslate('hooks.useAuthProviderRequired'))
  }
  return context
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

interface AuthProviderProps {
  config: AuthProviderConfig
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ config, children }) => {
  const {
    firebaseConfig,
    sessionKey = DEFAULT_SESSION_KEY,
    inactivityLimitDays = DEFAULT_INACTIVITY_DAYS,
    translate: translateProp,
    showError: showErrorProp,
    showInfo: showInfoProp,
    trackError: trackErrorProp,
    onPostLoginSetup,
    onDeleteAccount,
  } = config

  // Resolve injectable utilities with sensible no-op defaults
  const translate: TranslateFn = translateProp ?? defaultTranslate
  const showError: ShowErrorFn = showErrorProp ?? (() => { /* no-op */ })
  const showInfo: ShowInfoFn = showInfoProp ?? (() => { /* no-op */ })
  const trackError: TrackErrorFn = trackErrorProp ?? (() => { /* no-op */ })

  const auth = createFirebaseAuth(firebaseConfig)
  const inactivityLimitMs = inactivityLimitDays * 24 * 60 * 60 * 1000

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const manualAuthInProgressRef = useRef(false)
  const manualLogoutInProgressRef = useRef(false)
  const pendingRegistrationNameRef = useRef<string | null>(null)

  // ─── Session persistence helpers ──────────────────────────────────────────

  const saveSessionMetadata = async (email: string): Promise<void> => {
    const session: StoredSession = { email, lastAccessAt: new Date().toISOString() }
    await AsyncStorage.setItem(sessionKey, JSON.stringify(session))
  }

  const getStoredSession = async (): Promise<StoredSession | null> => {
    try {
      const raw = await AsyncStorage.getItem(sessionKey)
      if (!raw) return null
      const parsed = JSON.parse(raw) as StoredSession
      if (!parsed?.email || !parsed?.lastAccessAt) return null
      return parsed
    } catch {
      return null
    }
  }

  const clearStoredSession = async (): Promise<void> => {
    await AsyncStorage.removeItem(sessionKey)
  }

  const hasSessionExpired = (lastAccessAt: string): boolean => {
    const ts = new Date(lastAccessAt).getTime()
    if (Number.isNaN(ts)) return true
    return Date.now() - ts > inactivityLimitMs
  }

  // ─── Error display helper ─────────────────────────────────────────────────

  const buildFirebaseErrorDescription = (errorCode: string): string =>
    errorCode
      ? `${translate('errors.firebaseCodePrefix')} ${errorCode}. ${translate('errors.firestoreUsersProfilesRulesHint')}`
      : translate('errors.firestoreUsersProfilesRulesHint')

  const showFirebaseAuthError = (error: unknown, fallbackKey: string): void => {
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/invalid-credential') {
        showError(translate('auth.invalidCredentialsTitle'), translate('auth.invalidCredentialsDescription'))
        return
      }
      if (error.code === 'auth/invalid-email') {
        showError(translate('auth.invalidEmailTitle'), translate('auth.invalidEmailDescription'))
        return
      }
    }
    showError(translate(fallbackKey))
  }

  // ─── Email-verification helpers ───────────────────────────────────────────

  const isPasswordSignInSession = async (firebaseUser: User): Promise<boolean> => {
    try {
      const tokenResult = await firebaseUser.getIdTokenResult()
      return tokenResult.signInProvider === 'password'
    } catch {
      return false
    }
  }

  const sendVerificationEmailSafely = async (firebaseUser: User): Promise<VerificationEmailResult> => {
    try {
      await sendEmailVerification(firebaseUser)
      return { sent: true }
    } catch (error) {
      void trackError(error, {
        scope: 'AuthContext.sendVerificationEmailSafely',
        userId: firebaseUser.uid,
      })
      if (error instanceof FirebaseError) {
        return { sent: false, errorCode: error.code }
      }
      return { sent: false }
    }
  }

  const getFreshEmailVerifiedStatus = async (firebaseUser: User): Promise<boolean> => {
    try {
      await firebaseUser.getIdToken(true)
      await firebaseUser.reload()
      return (auth.currentUser ?? firebaseUser).emailVerified
    } catch (error) {
      void trackError(error, {
        scope: 'AuthContext.getFreshEmailVerifiedStatus',
        userId: firebaseUser.uid,
      })
      return firebaseUser.emailVerified
    }
  }

  // ─── Auth state processor ─────────────────────────────────────────────────

  const processAuthState = async (firebaseUser: User | null): Promise<void> => {
    if (manualLogoutInProgressRef.current) {
      if (!firebaseUser) manualLogoutInProgressRef.current = false
      return
    }

    if (!firebaseUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const passwordSession = await isPasswordSignInSession(firebaseUser)
    const isEmailVerified = passwordSession
      ? await getFreshEmailVerifiedStatus(firebaseUser)
      : firebaseUser.emailVerified

    if (passwordSession && !isEmailVerified) {
      await clearStoredSession()
      await signOut(auth)
      setUser(null)
      setLoading(false)
      return
    }

    const storedSession = await getStoredSession()

    if (!storedSession && manualAuthInProgressRef.current) {
      await saveSessionMetadata(firebaseUser.email ?? '')
      try {
        await onPostLoginSetup?.(firebaseUser, pendingRegistrationNameRef.current)
      } catch (error) {
        const errorCode = error instanceof FirebaseError ? error.code : ''
        void trackError(error, {
          scope: 'AuthContext.processAuthState.manualAuth',
          userId: firebaseUser.uid,
        })
        showError(
          translate('profile.defaultProfileCreateError'),
          buildFirebaseErrorDescription(errorCode),
        )
      }
      setUser(firebaseUser)
      setLoading(false)
      pendingRegistrationNameRef.current = null
      return
    }

    if (!storedSession || hasSessionExpired(storedSession.lastAccessAt)) {
      await clearStoredSession()
      await signOut(auth)
      setUser(null)
      setLoading(false)
      return
    }

    await saveSessionMetadata(firebaseUser.email ?? storedSession.email)
    try {
      await onPostLoginSetup?.(firebaseUser, pendingRegistrationNameRef.current)
    } catch (error) {
      const errorCode = error instanceof FirebaseError ? error.code : ''
      void trackError(error, {
        scope: 'AuthContext.processAuthState.restoreSession',
        userId: firebaseUser.uid,
      })
      showError(
        translate('auth.profileLoadErrorTitle'),
        buildFirebaseErrorDescription(errorCode),
      )
    }
    setUser(firebaseUser)
    setLoading(false)
    pendingRegistrationNameRef.current = null
  }

  // ─── Auth state listener ──────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void processAuthState(firebaseUser)
    })
    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Auth actions ─────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      manualAuthInProgressRef.current = true
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const isEmailVerified = await getFreshEmailVerifiedStatus(userCredential.user)

      if (!isEmailVerified) {
        await clearStoredSession()
        await signOut(auth)
        setUser(null)
        showInfo(
          translate('auth.emailPendingTitle'),
          translate('auth.emailPendingDescription'),
          { durationMs: 10000 },
        )
        return null
      }

      await saveSessionMetadata(email)
      setUser(auth.currentUser ?? userCredential.user)
      return userCredential.user.email
    } catch (error) {
      showFirebaseAuthError(error, 'auth.loginGenericError')
      void trackError(error, { scope: 'AuthContext.login', metadata: { email } })
      return null
    } finally {
      manualAuthInProgressRef.current = false
    }
  }

  const loginWithGoogle = async (
    idToken?: string,
    accessToken?: string,
  ): Promise<string | null> => {
    try {
      manualAuthInProgressRef.current = true

      if (!idToken && !accessToken) {
        showError(translate('auth.googleMissingToken'))
        return null
      }

      const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null)
      const userCredential = await signInWithCredential(auth, credential)
      pendingRegistrationNameRef.current = userCredential.user.displayName
      await saveSessionMetadata(userCredential.user.email ?? '')
      setUser(userCredential.user)
      return userCredential.user.email
    } catch (error) {
      showFirebaseAuthError(error, 'auth.googleLoginGenericError')
      void trackError(error, { scope: 'AuthContext.loginWithGoogle' })
      return null
    } finally {
      manualAuthInProgressRef.current = false
    }
  }

  const logout = async (): Promise<boolean> => {
    try {
      manualAuthInProgressRef.current = false
      manualLogoutInProgressRef.current = true
      await clearStoredSession()
      await signOut(auth)
      setUser(null)
      return true
    } catch (error) {
      manualLogoutInProgressRef.current = false
      showError(translate('auth.logoutGenericError'))
      void trackError(error, { scope: 'AuthContext.logout', userId: user?.uid })
      return false
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      showError(translate('auth.enterEmailTitle'), translate('auth.enterEmailDescription'))
      return false
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail)
      showInfo(translate('auth.checkEmailTitle'), translate('auth.checkEmailDescription'), { durationMs: 10000 })
      return true
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          showError(translate('auth.userNotFoundTitle'), translate('auth.userNotFoundDescription'))
          return false
        }
        if (error.code === 'auth/invalid-email') {
          showError(translate('auth.invalidEmailTitle'), translate('auth.invalidEmailDescription'))
          return false
        }
        showError(
          translate('auth.sendRecoveryEmailWithCodeTitle'),
          `${translate('errors.firebaseCodePrefix')} ${error.code}`,
        )
        return false
      }
      showError(translate('auth.sendRecoveryError'))
      return false
    }
  }

  const createAccount = async (
    name: string,
    email: string,
    password: string,
  ): Promise<string | null> => {
    try {
      manualAuthInProgressRef.current = true
      pendingRegistrationNameRef.current = name

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: name })

      const verificationResult = await sendVerificationEmailSafely(userCredential.user)
      await clearStoredSession()
      await signOut(auth)
      setUser(null)

      if (verificationResult.sent) {
        showInfo(
          translate('auth.checkEmailTitle'),
          translate('auth.checkVerificationEmailDescription'),
          { durationMs: 10000 },
        )
        return userCredential.user.email
      }

      const errorSuffix = verificationResult.errorCode
        ? ` ${translate('errors.firebaseCodePrefix')} ${verificationResult.errorCode}`
        : ''
      showError(
        translate('auth.verificationNotSentTitle'),
        `${translate('auth.verificationNotSentDescription')}${errorSuffix}`,
      )
      return userCredential.user.email
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          showError(translate('auth.emailInUseTitle'), translate('auth.emailInUseDescriptionRegistered'))
          return null
        }
        if (error.code === 'auth/credential-already-in-use') {
          showError(translate('auth.emailInUseTitle'), translate('auth.emailInUseDescriptionLinked'))
          return null
        }
      }
      showError(translate('auth.createUserGenericError'))
      void trackError(error, { scope: 'AuthContext.createAccount', metadata: { email } })
      return null
    } finally {
      manualAuthInProgressRef.current = false
    }
  }

  const deleteCurrentAccount = async (): Promise<boolean> => {
    const activeUser = auth.currentUser

    if (!activeUser) {
      showError(translate('auth.noActiveSessionTitle'), translate('auth.noActiveSessionDescription'))
      return false
    }

    try {
      manualAuthInProgressRef.current = false
      manualLogoutInProgressRef.current = true
      await clearStoredSession()

      try {
        await onDeleteAccount?.(activeUser.uid)
      } catch (error) {
        void trackError(error, {
          scope: 'AuthContext.deleteCurrentAccount.onDeleteAccount',
          userId: activeUser.uid,
        })
      }

      await deleteUser(activeUser)

      // deleteUser can already invalidate the session; signOut is best-effort.
      try { await signOut(auth) } catch { /* no-op */ }

      manualLogoutInProgressRef.current = false
      setUser(null)
      setLoading(false)
      return true
    } catch (error) {
      manualLogoutInProgressRef.current = false
      if (error instanceof FirebaseError && error.code === 'auth/requires-recent-login') {
        showError(translate('auth.protectedActionTitle'), translate('auth.protectedActionDescription'))
        return false
      }
      showError(translate('account.deleteTitle'), translate('auth.deleteAccountErrorDescription'))
      void trackError(error, {
        scope: 'AuthContext.deleteCurrentAccount',
        userId: activeUser.uid,
      })
      return false
    }
  }

  // ─── Provider value ───────────────────────────────────────────────────────

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    createAccount,
    resetPassword,
    deleteCurrentAccount,
    translate,
    showError,
    showInfo,
    trackError,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
