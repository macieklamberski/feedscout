import type { FaviconResult } from '../discover/types.js'

const guessPaths = [
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/favicon.png',
  '/favicon.svg',
]

export const discoverFaviconsFromGuess = (baseUrl: string): Array<FaviconResult> => {
  try {
    const origin = new URL(baseUrl).origin

    return guessPaths.map((path) => ({
      url: `${origin}${path}`,
      method: 'guess' as const,
    }))
  } catch {
    return []
  }
}
