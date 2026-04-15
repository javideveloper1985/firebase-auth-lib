import AsyncStorage from '@react-native-async-storage/async-storage'

export const AUTH_FORM_STORAGE_KEY = 'auth:last-form-identity'

export interface AuthFormIdentity {
  name: string
  email: string
}

export const saveLastAuthFormIdentity = async (data: AuthFormIdentity): Promise<void> => {
  await AsyncStorage.setItem(AUTH_FORM_STORAGE_KEY, JSON.stringify(data))
}

export const loadLastAuthFormIdentity = async (): Promise<AuthFormIdentity | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_FORM_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthFormIdentity>
    return {
      name: parsed?.name ?? '',
      email: parsed?.email ?? '',
    }
  } catch {
    return null
  }
}
