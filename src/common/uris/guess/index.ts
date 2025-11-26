import type { GuessMethodOptions } from './types.js'
import { generateUrlCombinations } from './utils.js'

export const discoverUrisFromGuess = (options: GuessMethodOptions): Array<string> => {
  const { baseUrl, uris, additionalBaseUrls = [] } = options
  const baseUrls = [baseUrl, ...additionalBaseUrls]

  return generateUrlCombinations(baseUrls, uris)
}
