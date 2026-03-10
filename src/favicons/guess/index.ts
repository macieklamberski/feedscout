import type { FaviconResult } from '../discover/types.js'

export const defaultGuessPaths = [
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/favicon.png',
  '/favicon.svg',
]

export type GuessMethodOptions = {
  paths?: Array<string>
}

export const discoverFaviconsFromGuess = (
  baseUrl: string,
  options: GuessMethodOptions = {},
): Array<FaviconResult> => {
  const { paths = defaultGuessPaths } = options

  try {
    const origin = new URL(baseUrl).origin

    return paths.map((path) => ({
      url: `${origin}${path}`,
      method: 'guess' as const,
    }))
  } catch {
    return []
  }
}
