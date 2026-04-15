import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useEmailPasswordAuth, type UseEmailPasswordAuthResult } from './useEmailPasswordAuth'
import { useGoogleAuth, type UseGoogleAuthConfig } from './useGoogleAuth'
import type { AppAuthType } from '../types'

export interface UseLoginOptions {
  /**
   * Called when a loading indicator should be shown (e.g. before the OAuth
   * browser opens or while credentials are validated).
   */
  showLoader?: (message: string) => void
  /** Called when the loading indicator should be hidden. */
  hideLoader?: () => void
  /** Optional Google OAuth configuration overrides. */
  googleConfig?: UseGoogleAuthConfig
}

export type UseLoginResult = UseEmailPasswordAuthResult & {
  isSubmitting: boolean
  handleLogin: (authType: AppAuthType) => Promise<void>
  handleRecoverPassword: () => Promise<void>
}

const noop = () => { /* no-op */ }

export const useLogin = (options?: UseLoginOptions): UseLoginResult => {
  const { translate, showInfo } = useAuth()
  const { handleLoginGoogle } = useGoogleAuth(options?.googleConfig)
  const showLoader = options?.showLoader ?? noop
  const hideLoader = options?.hideLoader ?? noop

  const emailPasswordAuth = useEmailPasswordAuth()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleRecoverPassword = React.useCallback(async (): Promise<void> => {
    if (isSubmitting) return
    await emailPasswordAuth.requestPasswordReset()
  }, [emailPasswordAuth, isSubmitting])

  const handleLogin = React.useCallback(
    async (authType: AppAuthType): Promise<void> => {
      if (isSubmitting) return
      setIsSubmitting(true)

      const loaderKey =
        authType === 'UserPass'
          ? 'auth.loggingIn'
          : authType === 'Google'
          ? 'auth.connectingWithGoogle'
          : authType === 'Facebook'
          ? 'auth.connectingWithFacebook'
          : 'auth.processingLogin'

      showLoader(translate(loaderKey))

      try {
        switch (authType) {
          case 'UserPass':
            await Promise.resolve(emailPasswordAuth.submitAuth())
            break
          case 'Google':
            await handleLoginGoogle()
            break
          default:
            showInfo(translate('auth.optionNotAvailable'))
        }
      } finally {
        hideLoader()
        setIsSubmitting(false)
      }
    },
    [
      emailPasswordAuth,
      handleLoginGoogle,
      hideLoader,
      isSubmitting,
      showInfo,
      showLoader,
      translate,
    ],
  )

  return {
    ...emailPasswordAuth,
    isSubmitting,
    handleLogin,
    handleRecoverPassword,
  }
}
