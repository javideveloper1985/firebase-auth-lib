import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useAuth } from '../context/AuthContext'
import { UserSchema } from '../validation/schemas'
import {
  loadLastAuthFormIdentity,
  saveLastAuthFormIdentity,
} from '../services/authFormStorage'

const EMPTY_FORM_VALUES = { name: '', email: '', password: '' }
const DEV_DUMMY_VALUES = { name: 'Demo User', email: 'demo@example.com', password: '12345678' }

export interface AuthIdentityFormData {
  name?: string
  email: string
  password: string
}

export type AuthIdentityMode = 'login' | 'register'

export interface UseAuthIdentityFlowResult {
  control: ReturnType<typeof useForm<AuthIdentityFormData>>['control']
  mode: AuthIdentityMode
  isRegisterMode: boolean
  submitIdentityAuth: () => void
  requestPasswordReset: () => Promise<void>
  toggleIdentityMode: () => void
}

export const useAuthIdentityFlow = (): UseAuthIdentityFlowResult => {
  const { user, createAccount, login, resetPassword } = useAuth()
  const [mode, setMode] = useState<AuthIdentityMode>('login')

  const resolver = yupResolver(UserSchema, {
    context: { isRegisterMode: mode === 'register' },
  }) as Resolver<AuthIdentityFormData>

  const { control, handleSubmit, reset, getValues, setValue } =
    useForm<AuthIdentityFormData>({
      resolver,
      mode: 'onChange',
      reValidateMode: 'onChange',
      defaultValues: __DEV__ ? DEV_DUMMY_VALUES : EMPTY_FORM_VALUES,
    })

  // Restore last-used identity on mount
  useEffect(() => {
    const restore = async () => {
      const saved = await loadLastAuthFormIdentity()
      if (!saved) {
        reset(__DEV__ ? DEV_DUMMY_VALUES : EMPTY_FORM_VALUES)
        return
      }
      reset({ name: saved.name, email: saved.email, password: '' })
    }
    void restore()
  }, [reset])

  // Persist email when the user logs in
  useEffect(() => {
    if (!user?.email) return
    void saveLastAuthFormIdentity({
      name: user.displayName ?? '',
      email: user.email,
    })
  }, [user])

  const submitFormData = async (data: AuthIdentityFormData): Promise<void> => {
    const name = data.name ?? ''
    await saveLastAuthFormIdentity({ name, email: data.email })

    if (mode === 'register') {
      const created = await createAccount(name, data.email, data.password)
      if (created) setMode('login')
      return
    }

    await login(data.email, data.password)
  }

  const requestPasswordReset = async (): Promise<void> => {
    if (mode !== 'login') return
    const email = getValues('email') ?? ''
    setValue('password', '', { shouldDirty: false, shouldTouch: false, shouldValidate: false })
    await resetPassword(email)
  }

  const toggleIdentityMode = (): void => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
  }

  return {
    control,
    mode,
    isRegisterMode: mode === 'register',
    submitIdentityAuth: handleSubmit(submitFormData),
    requestPasswordReset,
    toggleIdentityMode,
  }
}
