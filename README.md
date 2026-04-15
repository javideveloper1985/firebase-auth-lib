# expo-firebase-auth

A reusable Firebase authentication library for Expo / React Native applications. It provides a batteries-included `AuthProvider` + hooks for email/password and Google sign-in, with full dependency-injection for app-specific concerns (notifications, i18n, error tracking, post-login setup).

---

## Features

- Firebase email/password sign-in, registration, password reset
- Google OAuth sign-in (Expo Go + standalone builds)
- Session persistence with configurable inactivity timeout
- Email verification enforcement
- Account deletion flow
- Translatable — provide your own `translate` function or use the built-in English defaults
- Notification-agnostic — wire your own `showError` / `showInfo` implementations
- Error-tracking-agnostic — pass a `trackError` callback
- Post-login setup hook — run quota sync, profile creation, etc.

---

## Installation

```bash
# inside your Expo project
npm install ../packages/expo-firebase-auth
# or with yarn
yarn add ../packages/expo-firebase-auth
```

### Peer dependencies

Make sure these are installed in your project:

```bash
npm install firebase \
  @react-native-async-storage/async-storage \
  expo-auth-session expo-web-browser expo-constants \
  react-hook-form @hookform/resolvers yup
```

---

## Quick start

### 1. Wrap your app with `AuthProvider`

```tsx
// App.tsx
import { AuthProvider } from 'expo-firebase-auth'

export default function App() {
  return (
    <AuthProvider
      config={{
        firebaseConfig: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
        },
      }}
    >
      <YourApp />
    </AuthProvider>
  )
}
```

### 2. Use auth state anywhere

```tsx
import { useAuth } from 'expo-firebase-auth'

function Header() {
  const { user, logout } = useAuth()
  return user ? <Button title="Sign out" onPress={logout} /> : null
}
```

### 3. Use the login hook

```tsx
import { useLogin } from 'expo-firebase-auth'

function LoginScreen() {
  const {
    control,
    showNameField,
    titleKey,
    primaryButtonKey,
    secondaryButtonKey,
    toggleLoginVsSignIn,
    isSubmitting,
    handleLogin,
    handleRecoverPassword,
  } = useLogin()

  return (/* your UI */)
}
```

---

## `AuthProvider` configuration

All options are passed via a single `config` prop:

| Option | Type | Default | Description |
|---|---|---|---|
| `firebaseConfig` | `FirebaseConfig` | **required** | Firebase project config object |
| `sessionKey` | `string` | `'auth:user-session'` | AsyncStorage key for session metadata |
| `inactivityLimitDays` | `number` | `7` | Days before a restored session expires |
| `translate` | `(key: string) => string` | Built-in English | Called for every user-visible string |
| `showError` | `ShowErrorFn` | no-op | Display an error notification |
| `showInfo` | `ShowInfoFn` | no-op | Display an info notification |
| `trackError` | `TrackErrorFn` | no-op | Report non-fatal errors |
| `onPostLoginSetup` | `OnPostLoginSetupFn` | — | Run after every successful auth |
| `onDeleteAccount` | `OnDeleteAccountFn` | — | Clean up data before Firebase user is deleted |

### Full example with all options

```tsx
import {
  AuthProvider,
  defaultTranslate,
  type AuthProviderConfig,
} from 'expo-firebase-auth'
import { ShowError, ShowInfo } from './notifications'
import { translateLabel, getRuntimeLanguage } from './i18n'
import { trackAppError } from './errorTracking'
import { syncUserQuota, ensureDefaultProfile } from './userServices'

const authConfig: AuthProviderConfig = {
  firebaseConfig: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  },
  inactivityLimitDays: 7,
  translate: (key) => translateLabel(getRuntimeLanguage(), key),
  showError: ShowError,
  showInfo: ShowInfo,
  trackError: (error, meta) => trackAppError(error, meta),
  onPostLoginSetup: async (user, pendingName) => {
    await syncUserQuota()
    await ensureDefaultProfile({ userId: user.uid, displayName: pendingName })
  },
  onDeleteAccount: async (userId) => {
    await deleteUserData(userId)
  },
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider config={authConfig}>{children}</AuthProvider>
}
```

---

## Hooks

### `useAuth()`

Returns the full `AuthContextType`:

```ts
{
  user: User | null
  loading: boolean
  login(email, password): Promise<string | null>
  loginWithGoogle(idToken?, accessToken?): Promise<string | null>
  logout(): Promise<boolean>
  createAccount(name, email, password): Promise<string | null>
  resetPassword(email): Promise<boolean>
  deleteCurrentAccount(): Promise<boolean>
  // injected utilities (from config)
  translate: TranslateFn
  showError: ShowErrorFn
  showInfo: ShowInfoFn
  trackError: TrackErrorFn
}
```

### `useLogin(options?)`

Combines email/password and Google auth into one hook. Accepts an optional `options` object:

```ts
interface UseLoginOptions {
  showLoader?: (message: string) => void
  hideLoader?: () => void
  googleConfig?: UseGoogleAuthConfig
}
```

### `useEmailPasswordAuth()`

Lower-level hook for email/password forms. Returns `control` (react-hook-form), `submitAuth`, `requestPasswordReset`, mode flags and translation keys.

### `useGoogleAuth(config?)`

Handles the full Google OAuth flow (Expo Go proxy + standalone). Pass `UseGoogleAuthConfig` to override client IDs or redirect URIs.

### `useAuthIdentityFlow()`

Core flow hook combining login and register modes, form restoration from AsyncStorage, and form submission.

---

## i18n / Translation keys

All user-visible strings are looked up via the `translate` callback. The full set of keys with their English defaults is exported as `defaultTranslations`:

```ts
import { defaultTranslations, defaultTranslate } from 'expo-firebase-auth'
```

To override selected strings without replacing the whole translate function:

```ts
translate: (key) => myTranslations[key] ?? defaultTranslate(key)
```

---

## Google OAuth setup

Set the following environment variables in your Expo project:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
```

Or pass them directly to `useGoogleAuth` / `useLogin`:

```ts
useLogin({ googleConfig: { webClientId: 'xxx', androidClientId: 'yyy' } })
```
