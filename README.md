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

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [AuthProvider configuration](#authprovider-configuration)
- [Hooks](#hooks)
  - [useAuth](#useauth)
  - [useLogin](#useloginoptions)
  - [useEmailPasswordAuth](#useemailpasswordauth)
  - [useGoogleAuth](#usegoogleauthconfig)
  - [useAuthIdentityFlow](#useauthidentityflow)
- [i18n / Translation keys](#i18n--translation-keys)
- [Google OAuth setup](#google-oauth-setup)
- [Assets / Icon components](#assets--icon-components)
- [Services](#services)
- [Validation](#validation)
- [Configuration](#configuration)
- [TypeScript types](#typescript-types)
- [License](#license)

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

Combines email/password and Google auth into one hook. Returns a complete UI controller for login/registration screens.

**Options:**

```ts
interface UseLoginOptions {
  showLoader?: (message: string) => void
  hideLoader?: () => void
  googleConfig?: UseGoogleAuthConfig
}
```

**Returns (`UseLoginResult`):**

```ts
{
  // react-hook-form controller
  control: Control<AuthIdentityFormData>
  
  // UI state
  showNameField: boolean
  isSubmitting: boolean
  titleKey: string
  primaryButtonKey: string
  secondaryButtonKey: string
  
  // Actions
  handleLogin: (data: AuthIdentityFormData) => Promise<void>
  handleRecoverPassword: () => Promise<void>
  handleGoogleLogin: () => Promise<void>
  handleFacebookLogin: () => Promise<void>
  toggleLoginVsSignIn: () => void
}
```

**Example:**

```tsx
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
    handleGoogleLogin,
    handleRecoverPassword,
  } = useLogin()
  
  const { translate } = useAuth()

  return (
    <View>
      <Text>{translate(titleKey)}</Text>
      {showNameField && (
        <Controller
          control={control}
          name="name"
          render={({ field }) => <TextInput {...field} placeholder="Name" />}
        />
      )}
      <Controller
        control={control}
        name="email"
        render={({ field }) => <TextInput {...field} placeholder="Email" />}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => <TextInput {...field} placeholder="Password" secureTextEntry />}
      />
      <Button
        title={translate(primaryButtonKey)}
        onPress={control.handleSubmit(handleLogin)}
        disabled={isSubmitting}
      />
      <Button
        title={translate(secondaryButtonKey)}
        onPress={toggleLoginVsSignIn}
      />
      <Button title="Sign in with Google" onPress={handleGoogleLogin} />
      <Button title="Forgot password?" onPress={handleRecoverPassword} />
    </View>
  )
}
```

### `useEmailPasswordAuth()`

Lower-level hook for email/password forms. Use this if you want more control over the auth flow than `useLogin` provides.

**Returns (`UseEmailPasswordAuthResult`):**

```ts
{
  control: Control<EmailPasswordFormData>
  mode: AuthIdentityMode // 'login' | 'register'
  isSubmitting: boolean
  showNameField: boolean
  titleKey: string
  primaryButtonKey: string
  secondaryButtonKey: string
  submitAuth: (data: EmailPasswordFormData) => Promise<void>
  requestPasswordReset: () => Promise<void>
  toggleMode: () => void
}
```

### `useGoogleAuth(config?)`

Handles the full Google OAuth flow (Expo Go proxy + standalone builds).

**Config (`UseGoogleAuthConfig`):**

```ts
interface UseGoogleAuthConfig {
  webClientId?: string
  iosClientId?: string
  androidClientId?: string
  redirectUri?: string
}
```

Defaults are loaded from environment variables if not provided.

**Returns (`UseGoogleAuthResult`):**

```ts
{
  handleGoogleLogin: () => Promise<void>
  isLoading: boolean
}
```

### `useAuthIdentityFlow()`

Core flow hook combining login and register modes, form restoration from AsyncStorage, and form submission. This is used internally by `useEmailPasswordAuth` and `useLogin`.

**Returns (`UseAuthIdentityFlowResult`):**

```ts
{
  control: Control<AuthIdentityFormData>
  mode: AuthIdentityMode
  isSubmitting: boolean
  showNameField: boolean
  titleKey: string
  primaryButtonKey: string
  secondaryButtonKey: string
  handleSubmit: (data: AuthIdentityFormData) => Promise<void>
  handlePasswordReset: () => Promise<void>
  toggleMode: () => void
}
```

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

---

## Assets / Icon components

The library exports ready-to-use SVG icon components for OAuth providers:

### `GoogleIcon`

```tsx
import { GoogleIcon } from 'expo-firebase-auth'
import { TouchableOpacity, Text } from 'react-native'

function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth()
  
  return (
    <TouchableOpacity onPress={loginWithGoogle}>
      <GoogleIcon width={24} height={24} />
      <Text>Sign in with Google</Text>
    </TouchableOpacity>
  )
}
```

### `FacebookIcon`

```tsx
import { FacebookIcon } from 'expo-firebase-auth'

<FacebookIcon width={24} height={24} />
```

Both components accept all standard `SvgProps` from `react-native-svg`.

---

## Services

### Auth form storage

The library provides utilities to persist form data (name and email) locally, so users don't have to re-enter their information if they return to the login/registration screen:

```ts
import {
  saveLastAuthFormIdentity,
  loadLastAuthFormIdentity,
  AUTH_FORM_STORAGE_KEY,
  type AuthFormIdentity,
} from 'expo-firebase-auth'
```

#### `saveLastAuthFormIdentity(data: AuthFormIdentity)`

Saves the user's name and email to AsyncStorage.

```ts
await saveLastAuthFormIdentity({ name: 'Jane Doe', email: 'jane@example.com' })
```

#### `loadLastAuthFormIdentity()`

Retrieves the last saved form identity, or `null` if not found.

```ts
const saved = await loadLastAuthFormIdentity()
if (saved) {
  console.log(saved.name, saved.email)
}
```

#### `AUTH_FORM_STORAGE_KEY`

The AsyncStorage key used for form persistence: `'auth:last-form-identity'`.

#### `AuthFormIdentity`

```ts
interface AuthFormIdentity {
  name: string
  email: string
}
```

---

## Validation

### `UserSchema`

A Yup schema for validating authentication forms (name, email, password). The schema adapts based on the `isRegisterMode` context variable:

```ts
import { UserSchema } from 'expo-firebase-auth'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

const { control } = useForm({
  resolver: yupResolver(UserSchema),
  context: { isRegisterMode: true },
})
```

**Validation rules:**
- **name**: Required and min 2 characters (only in register mode)
- **email**: Valid email format, required
- **password**: Min 8 characters, required

---

## Configuration

### `createFirebaseAuth(config: FirebaseConfig)`

Initializes or returns the Firebase Auth singleton instance. You normally don't need to call this directly — `AuthProvider` handles it.

```ts
import { createFirebaseAuth } from 'expo-firebase-auth'

const auth = createFirebaseAuth({
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  appId: '...',
})
```

### `resetFirebaseAuthSingleton()`

Resets the Firebase Auth singleton (useful for testing or environment switching).

```ts
import { resetFirebaseAuthSingleton } from 'expo-firebase-auth'

resetFirebaseAuthSingleton()
```

---

## TypeScript types

All types are exported for use in your application:

### Core types

```ts
import type {
  // Config
  FirebaseConfig,
  AuthProviderConfig,
  
  // Context
  AuthContextType,
  
  // Callbacks
  TranslateFn,
  ShowErrorFn,
  ShowInfoFn,
  TrackErrorFn,
  OnPostLoginSetupFn,
  OnDeleteAccountFn,
  
  // Utilities
  AlertOptions,
  StoredSession,
  VerificationEmailResult,
  AppAuthType,
  
  // Form data
  AuthFormIdentity,
  AuthIdentityFormData,
  EmailPasswordFormData,
  
  // Hook results
  UseAuthIdentityFlowResult,
  UseEmailPasswordAuthResult,
  UseGoogleAuthResult,
  UseLoginResult,
} from 'expo-firebase-auth'
```

### Type definitions

#### `AuthContextType`

The shape of the context returned by `useAuth()`:

```ts
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  loginWithGoogle: (idToken?: string, accessToken?: string) => Promise<string | null>
  logout: () => Promise<boolean>
  createAccount: (name: string, email: string, password: string) => Promise<string | null>
  resetPassword: (email: string) => Promise<boolean>
  deleteCurrentAccount: () => Promise<boolean>
  translate: TranslateFn
  showError: ShowErrorFn
  showInfo: ShowInfoFn
  trackError: TrackErrorFn
}
```

#### `AppAuthType`

```ts
type AppAuthType = 'Google' | 'Facebook' | 'UserPass'
```

Used internally to distinguish authentication methods.

#### `AlertOptions`

```ts
interface AlertOptions {
  durationMs?: number
}
```

Optional configuration for notification duration.

#### `StoredSession`

```ts
interface StoredSession {
  email: string
  lastAccessAt: string // ISO date string
}
```

Session metadata persisted to AsyncStorage for inactivity checking.

#### `VerificationEmailResult`

```ts
interface VerificationEmailResult {
  sent: boolean
  errorCode?: string
}
```

Result of sending a verification email.

#### Hook result types

- **`UseAuthIdentityFlowResult`**: Core auth flow state and actions
- **`UseEmailPasswordAuthResult`**: Email/password form controller
- **`UseGoogleAuthResult`**: Google OAuth flow handler
- **`UseLoginResult`**: Combined login hook return value

---

## License

MIT
