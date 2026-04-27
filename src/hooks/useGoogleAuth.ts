import { useEffect } from 'react'
import { Platform } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import * as AuthSession from 'expo-auth-session'
import Constants from 'expo-constants'

import { useAuth } from '../context/AuthContext'

WebBrowser.maybeCompleteAuthSession()

export interface UseGoogleAuthConfig {
  /** 
   * Google OAuth web client ID (required for Firebase Auth on all platforms).
   * Used for authenticating with Firebase Auth backend.
   */
  webClientId?: string
  /** 
   * Android OAuth client ID (required for native Android builds, ignored in Expo Go/Web).
   * Used to verify the app signature on native Android.
   */
  androidClientId?: string
  /** 
   * iOS OAuth client ID (required for native iOS builds, ignored in Expo Go/Web).
   * Used to verify the app bundle ID on native iOS.
   */
  iosClientId?: string
  /** Expo account owner (used for Expo Go proxy redirect). */
  owner?: string
  /** Expo project slug (used for Expo Go proxy redirect). */
  slug?: string
  /** URI scheme registered in app.json. Falls back to `expo.scheme`. */
  redirectScheme?: string
  /** Path appended to the redirect URI. @default 'oauthredirect' */
  redirectPath?: string
}

export interface UseGoogleAuthResult {
  handleLoginGoogle: () => Promise<void>
}

const getDefaultScheme = (): string | string[] | undefined =>
  Constants.expoConfig?.scheme

export const useGoogleAuth = (config?: UseGoogleAuthConfig): UseGoogleAuthResult => {
  const { loginWithGoogle, translate, showError, trackError, googleConfig: contextGoogleConfig } = useAuth()

  // Merge configurations: context config > hook param > env vars
  const webClientId =
    config?.webClientId ?? 
    contextGoogleConfig?.webClientId ?? 
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 
    ''
  const androidClientId =
    config?.androidClientId ?? 
    contextGoogleConfig?.androidClientId ?? 
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? 
    ''
  const iosClientId =
    config?.iosClientId ?? 
    contextGoogleConfig?.iosClientId ?? 
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? 
    ''

  const isExpoGo = Constants.appOwnership === 'expo'
  const isWeb = Platform.OS === 'web'

  // ⚠️ Warn if credentials are missing (common in production builds)
  useEffect(() => {
    if (!webClientId) {
      console.warn(
        '[expo-firebase-auth] Google Auth configuration missing!\n' +
        'webClientId is required. Configure it in AuthProvider:\n\n' +
        '<AuthProvider config={{\n' +
        '  firebaseConfig: {...},\n' +
        '  googleConfig: {\n' +
        '    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,\n' +
        '    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,\n' +
        '    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,\n' +
        '  }\n' +
        '}}>\n\n' +
        '⚠️  NOTE: process.env is NOT replaced in node_modules during builds.\n' +
        'Pass these values from your app code.'
      )
    }
  }, [webClientId])

  const effectiveAndroidClientId = isExpoGo ? undefined : androidClientId
  const effectiveIosClientId = isExpoGo ? undefined : iosClientId

  const owner = config?.owner ?? Constants.expoConfig?.owner
  const slug = config?.slug ?? Constants.expoConfig?.slug

  const scheme = config?.redirectScheme ?? getDefaultScheme()
  const redirectScheme = Array.isArray(scheme) ? scheme[0] : scheme
  const redirectPath = config?.redirectPath ?? 'oauthredirect'

  const androidClientPrefix = androidClientId.replace('.apps.googleusercontent.com', '')
  const nativeRedirectScheme = androidClientPrefix
    ? `com.googleusercontent.apps.${androidClientPrefix}`
    : undefined

  const proxyRedirectUri =
    owner && slug ? `https://auth.expo.io/@${owner}/${slug}` : undefined

  const appRedirectUri = isWeb
    ? AuthSession.makeRedirectUri()
    : AuthSession.makeRedirectUri({
        native: nativeRedirectScheme
          ? `${nativeRedirectScheme}:/oauthredirect`
          : `${redirectScheme}:/oauthredirect`,
        scheme: redirectScheme,
        path: redirectPath,
      })

  const redirectUri = isExpoGo ? (proxyRedirectUri ?? appRedirectUri) : appRedirectUri

  const [googleRequest, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    webClientId,
    androidClientId: isWeb ? undefined : effectiveAndroidClientId,
    iosClientId: isWeb ? undefined : effectiveIosClientId,
    responseType: isExpoGo ? AuthSession.ResponseType.Token : undefined,
    selectAccount: true,
    redirectUri,
  })

  // Warm up browser on mobile
  useEffect(() => {
    if (isWeb) return
    void WebBrowser.warmUpAsync()
    return () => { void WebBrowser.coolDownAsync() }
  }, [isWeb])

  // Handle response from the OAuth flow triggered by promptAsync()
  useEffect(() => {
    const handleResponse = async () => {
      if (!response) return

      if (response.type === 'error') {
        showError(translate('auth.googleLoginErrorTitle'), translate('common.tryAgainInSeconds'))
        return
      }

      if (
        response.type === 'cancel' ||
        response.type === 'dismiss' ||
        response.type === 'locked'
      ) {
        showError(translate('auth.googleCanceled'))
        return
      }

      if (response.type !== 'success') {
        showError(translate('auth.googleLoginErrorTitle'), translate('common.tryAgain'))
        return
      }

      const idToken = response.params?.id_token ?? response.authentication?.idToken
      const accessToken =
        response.params?.access_token ?? response.authentication?.accessToken

      if (!idToken && !accessToken) {
        showError(translate('auth.googleMissingToken'))
        return
      }

      const loggedEmail = await loginWithGoogle(idToken, accessToken)
      if (!loggedEmail) {
        showError(
          translate('auth.googleLoginErrorTitle'),
          translate('auth.checkConnectionAndTryAgain'),
        )
      }
    }

    void handleResponse()
  }, [response, loginWithGoogle, showError, translate])

  const handleLoginGoogle = async (): Promise<void> => {
    // Validación de configuración (sin exponer credenciales)
    if (!redirectScheme) {
      console.error('[expo-firebase-auth] Missing redirectScheme for Google Auth')
      showError(
        translate('auth.googleConfigIncompleteTitle'),
        translate('auth.googleConfigMissingRedirect'),
      )
      return
    }

    if (isExpoGo && (!owner || !slug)) {
      console.error('[expo-firebase-auth] Missing owner/slug in Expo Go')
      showError(
        translate('auth.googleConfigIncompleteTitle'),
        translate('auth.googleConfigMissingOwnerSlug'),
      )
      return
    }

    // Web Client ID siempre es requerido (para Firebase Auth)
    if (!webClientId) {
      console.error('[expo-firebase-auth] Missing webClientId - required for Google Auth')
      showError(
        translate('auth.googleConfigIncompleteTitle'),
        translate('auth.googleConfigMissingWebClientId'),
      )
      return
    }
    
    // Para apps nativas (no Expo Go), también se requiere el client ID de la plataforma
    let missingNativeClientError: string | null = null
    
    if (Platform.OS === 'android' && !isExpoGo && !androidClientId) {
      missingNativeClientError = 'auth.googleConfigMissingAndroidClientId'
      console.error('[expo-firebase-auth] Missing androidClientId for native Android')
    } else if (Platform.OS === 'ios' && !isExpoGo && !iosClientId) {
      missingNativeClientError = 'auth.googleConfigMissingIosClientId'
      console.error('[expo-firebase-auth] Missing iosClientId for native iOS')
    }
    
    if (missingNativeClientError) {
      showError(
        translate('auth.googleConfigIncompleteTitle'),
        translate(missingNativeClientError),
      )
      return
    }

    try {
      if (isExpoGo && googleRequest && proxyRedirectUri) {
        const requestUrl = googleRequest.url ?? ''
        const expoGoUrl = (() => {
          const url = new URL(requestUrl)
          url.searchParams.set('response_type', 'token')
          url.searchParams.delete('code_challenge')
          url.searchParams.delete('code_challenge_method')
          return url.toString()
        })()

        const proxyStartUrl = `${proxyRedirectUri}/start?${new URLSearchParams({
          authUrl: expoGoUrl,
          returnUrl: appRedirectUri,
        }).toString()}`

        const result = await WebBrowser.openAuthSessionAsync(proxyStartUrl, appRedirectUri)
        if (result.type !== 'success') {
          showError(translate('auth.googleCanceled'))
          return
        }

        const parsed = googleRequest.parseReturnUrl(result.url)
        if (parsed.type === 'error') {
          showError(translate('auth.googleLoginErrorTitle'), translate('auth.googleValidateAccountError'))
          return
        }
        if (parsed.type !== 'success') {
          showError(translate('auth.googleLoginErrorTitle'), translate('common.tryAgain'))
          return
        }

        const idToken: string | undefined = parsed.params?.id_token
        const accessToken: string | undefined = parsed.params?.access_token

        if (!idToken && !accessToken) {
          showError(translate('auth.googleLoginErrorTitle'), translate('auth.googleAuthIncomplete'))
          return
        }

        const loggedEmail = await loginWithGoogle(idToken, accessToken)
        if (!loggedEmail) {
          showError(
            translate('auth.googleLoginErrorTitle'),
            translate('auth.checkConnectionAndTryAgain'),
          )
        }
        return
      }

      await promptAsync()
    } catch (error) {
      void trackError(error, {
        scope: 'useGoogleAuth.handleLoginGoogle',
        metadata: { platform: Platform.OS, isExpoGo },
      })
      showError(translate('auth.googleLoginErrorTitle'), translate('common.tryAgainInSeconds'))
    }
  }

  return { handleLoginGoogle }
}
