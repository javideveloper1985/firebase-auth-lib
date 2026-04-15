import { useForm } from 'react-hook-form'
import { useAuthIdentityFlow, type AuthIdentityFormData } from './useAuthIdentityFlow'

export type EmailPasswordFormData = AuthIdentityFormData

export interface UseEmailPasswordAuthResult {
  control: ReturnType<typeof useForm<EmailPasswordFormData>>['control']
  submitAuth: () => void
  requestPasswordReset: () => Promise<void>
  isCreatingAccount: boolean
  showNameField: boolean
  /** Translation key for the screen title. */
  titleKey: string
  /** Translation key for the primary action button. */
  primaryButtonKey: string
  /** Translation key for the secondary toggle link. */
  secondaryButtonKey: string
  toggleLoginVsSignIn: () => void
}

export const useEmailPasswordAuth = (): UseEmailPasswordAuthResult => {
  const {
    control,
    isRegisterMode,
    submitIdentityAuth,
    requestPasswordReset,
    toggleIdentityMode,
  } = useAuthIdentityFlow()

  return {
    control,
    submitAuth: submitIdentityAuth,
    requestPasswordReset,
    isCreatingAccount: isRegisterMode,
    showNameField: isRegisterMode,
    titleKey: isRegisterMode ? 'auth.createAccount' : 'auth.startSession',
    primaryButtonKey: isRegisterMode ? 'auth.createAccount' : 'auth.startSession',
    secondaryButtonKey: isRegisterMode ? 'auth.alreadyHaveAccount' : 'auth.createAccount',
    toggleLoginVsSignIn: toggleIdentityMode,
  }
}
