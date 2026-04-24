# @javideveloper1985/expo-firebase-auth

A production-ready Firebase authentication library for Expo / React Native applications. Provides email/password and Google OAuth sign-in with built-in session management, form validation, and extensible hooks.

[![npm version](https://badge.fury.io/js/@javideveloper1985%2Fexpo-firebase-auth.svg)](https://www.npmjs.com/package/@javideveloper1985/expo-firebase-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 🔐 **Email/Password & Google OAuth** - Complete authentication flows
- 📱 **Cross-platform** - Works on iOS, Android, and Web
- 🎣 **React Hooks** - Simple `useAuth()` and `useLogin()` hooks
- 🔄 **Session Persistence** - Automatic session restoration with configurable timeout
- ✅ **Form Validation** - Built-in Yup schemas with react-hook-form
- 🌍 **i18n Ready** - Fully translatable with custom translation functions
- 🎨 **UI Agnostic** - Bring your own UI components or use the provided hooks
- 🔌 **Extensible** - Inject custom error handlers, notifications, and post-login logic
- 📧 **Email Verification** - Enforce email verification before access
- 🗑️ **Account Deletion** - Complete user data cleanup flow

---

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start (5 minutes)](#-quick-start-5-minutes)
- [Step-by-Step Setup](#-step-by-step-setup)
  - [1. Firebase Console Setup](#1-firebase-console-setup)
  - [2. Google Cloud Console Setup](#2-google-cloud-console-setup)
  - [3. Configure Your App](#3-configure-your-app)
  - [4. Add Google OAuth Scheme](#4-add-google-oauth-scheme-important)
- [Complete Code Examples](#-complete-code-examples)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Migration Guide](#-migration-guide)
- [License](#-license)

---

## 📦 Installation

```bash
npm install @javideveloper1985/expo-firebase-auth
```

### Required Peer Dependencies

```bash
npm install firebase \
  @react-native-async-storage/async-storage \
  expo-auth-session expo-web-browser expo-constants \
  react-hook-form @hookform/resolvers yup
```

**Minimum versions:**
- `firebase` >= 12.0.0
- `expo` >= 50.0.0
- React Native >= 0.70

---

## 🚀 Quick Start (5 minutes)

### 1. Create Firebase Auth Singleton

```typescript
// src/auth/firebaseAuth.ts
import { createFirebaseAuth } from '@javideveloper1985/expo-firebase-auth';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Export auth singleton - this MUST be called before using other Firebase services
export const auth = createFirebaseAuth(firebaseConfig);
```

### 2. Wrap Your App with AuthProvider

```typescript
// App.tsx
import { AuthProvider } from '@javideveloper1985/expo-firebase-auth';
import { firebaseConfig } from './src/auth/firebaseAuth';

export default function App() {
  return (
    <AuthProvider config={{ firebaseConfig }}>
      <YourAppContent />
    </AuthProvider>
  );
}
```

### 3. Use Auth in Components

```typescript
// src/screens/LoginScreen.tsx
import { useLogin, GoogleIcon } from '@javideveloper1985/expo-firebase-auth';
import { Controller } from 'react-hook-form';

export function LoginScreen() {
  const { control, isSubmitting, handleLogin } = useLogin();

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextInput {...field} placeholder="Email" />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput {...field} placeholder="Password" secureTextEntry />
        )}
      />
      
      <Button 
        title="Login" 
        onPress={() => handleLogin('UserPass')}
        disabled={isSubmitting}
      />
      
      <Pressable onPress={() => handleLogin('Google')}>
        <GoogleIcon width={24} height={24} />
        <Text>Continue with Google</Text>
      </Pressable>
    </View>
  );
}
```

### 4. Check Auth State

```typescript
// src/navigation/AppRouter.tsx
import { useAuth } from '@javideveloper1985/expo-firebase-auth';

export function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  
  return <MainApp />;
}
```

**That's it! You now have working authentication.** 🎉

For production apps, continue with the complete setup below.

---

## 📖 Step-by-Step Setup

## 📖 Step-by-Step Setup

### 1. Firebase Console Setup

#### a) Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select existing project
3. Follow the wizard to create your project

#### b) Enable Authentication Methods
1. In Firebase Console, go to **Build** → **Authentication** → **Sign-in method**
2. **Enable Email/Password:**
   - Click **Email/Password**
   - Toggle **Enable**
   - Click **Save**

3. **Enable Google Sign-In:**
   - Click **Google**
   - Toggle **Enable**
   - Set **Project support email** (required)
   - Click **Save**

#### c) Configure Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add these domains (click **Add domain** for each):
   - `localhost` (for local development)
   - Your production domain (e.g., `myapp.com`)
   - Your Expo web URL if deployed (e.g., `myapp.onrender.com`)

#### d) Get Firebase Config
1. Go to **Project Settings** (gear icon near "Project Overview")
2. Scroll to **Your apps** section
3. Click the **Web** icon (`</>`) to register a web app
4. Copy the `firebaseConfig` object
5. Save these values to your `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

### 2. Google Cloud Console Setup

Google OAuth requires creating OAuth Client IDs in Google Cloud Console:

#### a) Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the **same project** as your Firebase project (they're linked)
3. Navigate to **APIs & Services** → **Credentials**

#### b) Create Web Client ID (Required for ALL platforms)

**This is the most important step - even mobile apps need the Web Client ID!**

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. **Application type:** Web application
3. **Name:** `Web Client (Expo)`
4. **Authorized JavaScript origins:** Add these URLs:
   - `http://localhost:8081` (Expo web development)
   - `http://localhost:19006` (alternative Expo port)
   - Your production URL (e.g., `https://myapp.com`)

5. **Authorized redirect URIs:** Add these:
   - `http://localhost:8081/__/auth/handler` (local development)
   - `https://your-project.firebaseapp.com/__/auth/handler` (Firebase hosting)
   - `https://myapp.com/__/auth/handler` (your production domain)

6. Click **CREATE**
7. Copy the **Client ID** → Save as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

#### c) Create Android Client ID (For Android APK - Optional)

**Only needed if building standalone Android APK. Skip for Expo Go or web-only apps.**

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. **Application type:** Android
3. **Name:** `Android Client`
4. **Package name:** Your app's package from `app.json` (e.g., `com.mycompany.myapp`)
   ```json
   {
     "expo": {
       "android": {
         "package": "com.mycompany.myapp"  // ← Use this
       }
     }
   }
   ```

5. **SHA-1 certificate fingerprint:** Get it by running:
   ```bash
   # For DEBUG builds (development):
   keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
   # Password when prompted: android
   
   # For RELEASE builds (production):
   keytool -keystore path/to/your-release-key.keystore -list -v
   ```
   
   Look for `SHA1:` in the output and copy the value (e.g., `A1:B2:C3:...`)

6. Click **CREATE**
7. Copy the **Client ID** → Save as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

```env
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-xyz789.apps.googleusercontent.com
```

#### d) Create iOS Client ID (For iOS builds - Optional)

**Only needed if building standalone iOS app. Skip for Expo Go or web-only apps.**

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. **Application type:** iOS
3. **Name:** `iOS Client`
4. **Bundle ID:** Your app's bundle identifier from `app.json` (e.g., `com.mycompany.myapp`)
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.mycompany.myapp"  // ← Use this
       }
     }
   }
   ```

5. Click **CREATE**
6. Copy the **Client ID** → Save as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

```env
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios123.apps.googleusercontent.com
```

---

### 3. Configure Your App

#### a) Create `.env` file

Create a `.env` file in your project root with all the credentials:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-xyz789.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios123.apps.googleusercontent.com
```

> **Note:** All variables must start with `EXPO_PUBLIC_` to be accessible in your app.

#### b) Add `.env` to `.gitignore`

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

**Never commit your `.env` file to version control!**

---

### 4. Add Google OAuth Scheme (IMPORTANT!)

For Google Sign-In to work properly, you need to add the OAuth callback scheme to your app configuration.

#### Option A: Using `app.config.js` (Recommended)

Rename `app.json` to `app.config.js` and add dynamic scheme configuration:

```javascript
// app.config.js
const appJson = require('./app.json');

const GOOGLE_CLIENT_SUFFIX = '.apps.googleusercontent.com';

module.exports = ({ config }) => {
  const baseConfig = config || appJson.expo;
  
  // Extract Google Client ID from environment
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
  
  // Calculate Google OAuth callback scheme
  const androidClientPrefix = androidClientId.endsWith(GOOGLE_CLIENT_SUFFIX)
    ? androidClientId.replace(GOOGLE_CLIENT_SUFFIX, '')
    : '';

  const googleCallbackScheme = androidClientPrefix
    ? `com.googleusercontent.apps.${androidClientPrefix}`
    : undefined;

  // Merge with existing schemes
  const baseSchemes = ['myapp']; // Your app's custom scheme
  const mergedSchemes = googleCallbackScheme
    ? Array.from(new Set([...baseSchemes, googleCallbackScheme]))
    : baseSchemes;

  return {
    ...baseConfig,
    scheme: mergedSchemes,
  };
};
```

Then rename your `app.json`:

```json
// Keep app.json for the base configuration
{
  "expo": {
    "name": "My App",
    "slug": "myapp",
    "version": "1.0.0",
    // ... rest of your config
  }
}
```

#### Option B: Manual Configuration in `app.json`

If you prefer not to use `app.config.js`, manually add the scheme:

```json
{
  "expo": {
    "scheme": [
      "myapp",
      "com.googleusercontent.apps.123456789-abc123"
    ]
  }
}
```

Replace `123456789-abc123` with your actual Android Client ID prefix.

**How to find the prefix:**
If your `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is:
```
123456789-abc123def456.apps.googleusercontent.com
```

The prefix is: `123456789-abc123def456`

So your scheme would be: `com.googleusercontent.apps.123456789-abc123def456`

---

## 💻 Complete Code Examples

### Recommended Project Structure

```
your-app/
├── .env                          # Environment variables
├── app.json                      # Base Expo config
├── app.config.js                 # Dynamic config (optional)
├── App.tsx                       # Root component
└── src/
    ├── auth/
    │   ├── firebaseAuth.ts       # Firebase singleton
    │   ├── AuthProvider.tsx      # Auth configuration
    │   └── screens/
    │       ├── LoginScreen.tsx
    │       ├── RegisterScreen.tsx
    │       └── ForgotPasswordScreen.tsx
    ├── navigation/
    │   └── AppRouter.tsx         # Auth-aware navigation
    └── screens/
        └── HomeScreen.tsx
```

### Complete Example: Firebase Auth Singleton

```typescript
// src/auth/firebaseAuth.ts
import { createFirebaseAuth } from '@javideveloper1985/expo-firebase-auth';
import { getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Create auth singleton - MUST be called before other Firebase services
export const auth = createFirebaseAuth(firebaseConfig);

// Get the initialized Firebase app
const app = getApps()[0];

// Export other Firebase services using the same app instance
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**⚠️ IMPORTANT:** Always call `createFirebaseAuth()` BEFORE initializing other Firebase services (Firestore, Storage, etc). The library handles Firebase app initialization internally.

### Complete Example: AuthProvider Configuration

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
### Complete Example: AuthProvider Configuration

```typescript
// App.tsx
import { Alert } from 'react-native';
import { AuthProvider, type AuthProviderConfig } from '@javideveloper1985/expo-firebase-auth';
import { firebaseConfig } from './src/auth/firebaseAuth';
import { createUserProfile } from './src/services/userService';

const authConfig: AuthProviderConfig = {
  firebaseConfig,
  
  // Session timeout (days)
  inactivityLimitDays: 7,
  
  // Error handling
  showError: (title, message) => {
    console.error('Auth Error:', title, message);
    Alert.alert(title, message);
  },
  
  // Info messages
  showInfo: (message) => {
    console.log('Auth Info:', message);
    Alert.alert('Info', message);
  },
  
  // Error tracking (integrate with Sentry, Bugsnag, etc.)
  trackError: (error, metadata) => {
    console.error('Auth Tracking Error:', error, metadata);
    // Example: Sentry.captureException(error, { extra: metadata });
  },
  
  // Post-login setup (create user profile, sync data, etc.)
  onPostLoginSetup: async (user, pendingName) => {
    console.log('Post-login setup for user:', user.uid);
    
    // Create user profile in Firestore
    await createUserProfile({
      uid: user.uid,
      email: user.email!,
      displayName: pendingName || user.displayName || 'User',
    });
    
    // Sync user quota, initialize app data, etc.
    // await syncUserQuota(user.uid);
  },
  
  // Pre-account deletion cleanup
  onDeleteAccount: async (userId) => {
    console.log('Cleaning up data for user:', userId);
    
    // Delete user data from Firestore, Storage, etc.
    // await deleteUserData(userId);
  },
  
  // Custom translations (optional)
  translate: (key) => {
    // Example: return i18n.t(key);
    return key; // Use default English
  },
};

export default function App() {
  return (
    <AuthProvider config={authConfig}>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <LoginScreen />;
  }
  
  return <MainApp />;
}
```

### Complete Example: Login Screen

```typescript
// src/auth/screens/LoginScreen.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { useLogin, GoogleIcon } from '@javideveloper1985/expo-firebase-auth';

export function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    control,
    showNameField,
    toggleLoginVsSignIn,
    isSubmitting,
    handleLogin,
  } = useLogin();

  // Hide name field if we're in login mode
  if (showNameField) {
    toggleLoginVsSignIn();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      
      {/* Email Field */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <View>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        )}
      />
      
      {/* Password Field */}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <View>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!showPassword}
              editable={!isSubmitting}
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        )}
      />
      
      {/* Email/Password Login Button */}
      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={() => handleLogin('UserPass')}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>
      
      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>
      
      {/* Google Sign-In Button */}
      <Pressable
        style={[styles.googleButton, isSubmitting && styles.buttonDisabled]}
        onPress={() => handleLogin('Google')}
        disabled={isSubmitting}
      >
        <GoogleIcon width={20} height={20} />
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </Pressable>
      
      {/* Links */}
      <Pressable onPress={() => {/* Navigate to forgot password */}}>
        <Text style={styles.linkText}>Forgot password?</Text>
      </Pressable>
      
      <Pressable onPress={() => {/* Navigate to register */}}>
        <Text style={styles.linkText}>
          Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f6fa',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#007AFF',
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: 'bold',
  },
});
```

---

## 📚 API Reference

### AuthProvider Configuration

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `firebaseConfig` | `FirebaseConfig` | ✅ Yes | - | Firebase project configuration object |
| `inactivityLimitDays` | `number` | No | `7` | Days before restored session expires |
| `sessionKey` | `string` | No | `'auth:user-session'` | AsyncStorage key for session data |
| `showError` | `(title: string, message?: string) => void` | No | no-op | Display error notifications |
| `showInfo` | `(message: string) => void` | No | no-op | Display info notifications |
| `trackError` | `(error: Error, metadata?: object) => void` | No | no-op | Report errors to tracking service |
| `onPostLoginSetup` | `(user: User, pendingName?: string) => Promise<void>` | No | - | Run after successful authentication |
| `onDeleteAccount` | `(userId: string) => Promise<void>` | No | - | Clean up before account deletion |
| `translate` | `(key: string) => string` | No | English | Translate UI strings |

### useAuth() Hook

```typescript
const {
  user,                    // Firebase User | null
  loading,                 // boolean - initial auth check
  login,                   // (email, password) => Promise<string | null>
  loginWithGoogle,         // (idToken?, accessToken?) => Promise<string | null>
  logout,                  // () => Promise<boolean>
  createAccount,           // (name, email, password) => Promise<string | null>
  resetPassword,           // (email) => Promise<boolean>
  deleteCurrentAccount,    // () => Promise<boolean>
  translate,               // (key: string) => string
  showError,               // (title, message?) => void
  showInfo,                // (message) => void
  trackError,              // (error, metadata?) => void
} = useAuth();
```

### useLogin() Hook

```typescript
const {
  control,                 // react-hook-form control
  showNameField,           // boolean - true for register mode
  isSubmitting,            // boolean - true during auth request
  titleKey,                // string - i18n key for screen title
  primaryButtonKey,        // string - i18n key for main button
  secondaryButtonKey,      // string - i18n key for toggle button
  handleLogin,             // (authType: 'UserPass' | 'Google') => Promise<void>
  handleRecoverPassword,   // () => Promise<void>
  toggleLoginVsSignIn,     // () => void - switch login/register
} = useLogin(options);
```

**UseLoginOptions:**
```typescript
{
  showLoader?: (message: string) => void;
  hideLoader?: () => void;
  googleConfig?: {
    webClientId?: string;
    androidClientId?: string;
    iosClientId?: string;
  };
}
```

### Icons

```typescript
import { GoogleIcon, FacebookIcon } from '@javideveloper1985/expo-firebase-auth';

// Both accept standard SvgProps
<GoogleIcon width={24} height={24} fill="#EA4335" />
<FacebookIcon width={24} height={24} />
```

---

## 🔧 Troubleshooting

### Google Sign-In Not Working

#### Problem: "Google login completes but user state doesn't update"

**Solution:**
1. Make sure `createFirebaseAuth()` is called BEFORE using AuthProvider
2. Don't manually initialize Firebase with `initializeApp()` - the library does this
3. Verify Web Client ID is set in `.env`:
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
   ```

**Correct Pattern:**
```typescript
// ✅ CORRECT
// firebaseAuth.ts
export const auth = createFirebaseAuth(firebaseConfig);

// App.tsx
<AuthProvider config={{ firebaseConfig }}>
```

**Incorrect Pattern:**
```typescript
// ❌ WRONG - Don't do this
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

#### Problem: "popup_closed_by_user" or OAuth popup doesn't open

**Cause:** Missing or incorrect redirect URIs in Google Cloud Console

**Solution:**
1. Go to Google Cloud Console → Credentials → Your Web Client ID
2. Add these to **Authorized redirect URIs**:
   ```
   http://localhost:8081/__/auth/handler
   https://your-project.firebaseapp.com/__/auth/handler
   ```
3. Also add to **Authorized JavaScript origins**:
   ```
   http://localhost:8081
   ```
4. Wait 5 minutes for changes to propagate

#### Problem: "auth/invalid-api-key"

**Cause:** Missing or incorrect Firebase API key

**Solution:**
1. Check `.env` file has correct `EXPO_PUBLIC_FIREBASE_API_KEY`
2. Verify it matches Firebase Console → Project Settings → Web app config
3. Restart Metro bundler after changing `.env`:
   ```bash
   npm start -- --reset-cache
   ```

### Android Build Issues

#### Problem: Google Sign-In doesn't work on Android APK

**Cause:** Missing SHA-1 fingerprint or Android Client ID

**Solution:**
1. Generate SHA-1 fingerprint:
   ```bash
   # Debug
   keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
   
   # Release
   keytool -keystore your-release-key.keystore -list -v
   ```

2. Add SHA-1 to Google Cloud Console → Credentials → Android Client ID

3. Verify environment variables:
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=yyy.apps.googleusercontent.com
   ```

4. Add Google callback scheme to `app.config.js` (see setup section above)

### TypeScript Errors

#### Problem: "Cannot find module '@javideveloper1985/expo-firebase-auth'"

**Solution:**
1. Install the library:
   ```bash
   npm install @javideveloper1985/expo-firebase-auth
   ```

2. If still not working, check `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Session / State Issues

#### Problem: User stays logged in after logout

**Cause:** Session not properly cleared from AsyncStorage

**Solution:**
```typescript
// Use the built-in logout function
const { logout } = useAuth();
await logout();

// If issue persists, manually clear:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('auth:user-session');
```

#### Problem: "Session expired" on every app restart

**Cause:** `inactivityLimitDays` set too low

**Solution:**
```typescript
<AuthProvider 
  config={{ 
    firebaseConfig,
    inactivityLimitDays: 30  // Increase to 30 days
  }}
>
```

### Web-Specific Issues

#### Problem: ".env variables are undefined"

**Cause:** Expo web doesn't load `.env` automatically in some cases

**Solution:**
1. Use `expo-constants`:
   ```typescript
   import Constants from 'expo-constants';
   
   const apiKey = Constants.expoConfig?.extra?.firebaseApiKey;
   ```

2. Or use `app.config.js`:
   ```javascript
   module.exports = {
     expo: {
       extra: {
         firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
       }
     }
   };
   ```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `auth/invalid-email` | Malformed email address | Validate email format before submission |
| `auth/user-disabled` | Account disabled in Firebase Console | Re-enable user in Authentication tab |
| `auth/user-not-found` | Email not registered | Check email or use "Sign up" flow |
| `auth/wrong-password` | Incorrect password | Verify password or use "Forgot password" |
| `auth/email-already-in-use` | Email exists | Use "Sign in" instead of "Sign up" |
| `auth/weak-password` | Password too short | Firebase requires 6+ characters |
| `auth/popup-blocked` | Browser blocked popup | Allow popups for your domain |
| `auth/popup-closed-by-user` | User closed OAuth popup | No action needed - expected behavior |
| `auth/network-request-failed` | No internet connection | Check network connectivity |
| `auth/too-many-requests` | Rate limited | Wait a few minutes before retry |

---

## 🔄 Migration Guide

### From Firebase Auth SDK Directly

If you're migrating from using Firebase Auth directly:

**Before:**
```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
await signInWithEmailAndPassword(auth, email, password);
```

**After:**
```typescript
import { useAuth } from '@javideveloper1985/expo-firebase-auth';

const { login } = useAuth();
await login(email, password);
```

### From Other Auth Libraries

**Key differences:**
- No need to manually manage auth state with `onAuthStateChanged`
- Built-in form validation with react-hook-form
- Session persistence handled automatically
- Google OAuth configured once, works everywhere

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

---

## 📄 License

MIT © Javi Developer

---

## 💡 Tips for AI Agents

When helping developers use this library:

1. **Always recommend** `createFirebaseAuth()` for initialization - never `initializeApp()` + `getAuth()`
2. **Check environment variables** are prefixed with `EXPO_PUBLIC_`
3. **Verify Google Cloud Console setup** - Web Client ID is required even for mobile
4. **Remind about app.config.js** for dynamic Google OAuth scheme
5. **Suggest onPostLoginSetup** for creating user profiles/documents
6. **Common fix:** Restart Metro bundler after `.env` changes

### Quick Diagnosis Checklist

- [ ] Is `createFirebaseAuth()` called before `AuthProvider`?
- [ ] Are all env vars in `.env` prefixed with `EXPO_PUBLIC_`?
- [ ] Is Web Client ID configured in Google Cloud Console?
- [ ] Are redirect URIs added to Google Cloud Console?
- [ ] Is `app.config.js` configured with Google callback scheme?
- [ ] Has Metro bundler been restarted after `.env` changes?
- [ ] Are Firebase Console authorized domains configured?

---

**Made with ❤️ for the Expo community**