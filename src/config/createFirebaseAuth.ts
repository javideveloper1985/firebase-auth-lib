import { initializeApp, getApps } from 'firebase/app'
import { browserLocalPersistence, getAuth, initializeAuth } from 'firebase/auth'
import type { Persistence, Auth } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { FirebaseConfig } from '../types'

let _authInstance: Auth | null = null

/**
 * Initialises Firebase and returns the `Auth` instance.
 *
 * Calling this multiple times is safe — after the first call the same
 * singleton `Auth` object is returned without re-initialising Firebase.
 */
export const createFirebaseAuth = (config: FirebaseConfig): Auth => {
  if (_authInstance) {
    return _authInstance
  }

  const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]

  if (Platform.OS === 'web') {
    _authInstance = initializeAuth(app, { persistence: browserLocalPersistence })
  } else {
    // getReactNativePersistence is tree-shaken correctly only when required
    // at runtime, which avoids bundling issues on web.
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence
    }
    _authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  }

  // Ensure getAuth() is aligned with our initializeAuth instance
  getAuth(app)

  return _authInstance
}

/**
 * Resets the cached Auth singleton.
 * Useful in tests or when switching Firebase projects.
 */
export const resetFirebaseAuthSingleton = (): void => {
  _authInstance = null
}
