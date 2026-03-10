import { defaultGuessPaths } from '../defaults.js'
import type { FaviconResult } from '../types.js'

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
      method: 'guess',
    }))
  } catch {
    return []
  }
}
