/**
 * Ambient declaration for `process.env` in React Native / Expo bundler
 * environments where injected env vars are replaced at bundle time.
 *
 * Note: this is NOT the Node.js `process` object — only `env` is declared.
 */
declare const process: {
  readonly env: Record<string, string | undefined>
}

declare const __DEV__: boolean
