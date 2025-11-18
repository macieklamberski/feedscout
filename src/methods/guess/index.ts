import { feedUrisBalanced } from '../../defaults.js'
import type { Options } from './types.js'
import { generateFeedUrlCombinations } from './utils.js'

export { feedUrisBalanced, feedUrisComprehensive, feedUrisMinimal } from '../../defaults.js'
export { getSubdomainVariants, getWwwCounterpart } from './utils.js'

export const discoverFeedUrisFromGuess = (options: Options): Array<string> => {
  const { baseUrl, feedUris = feedUrisBalanced, additionalBaseUrls = [] } = options

  const baseUrls = [baseUrl, ...additionalBaseUrls]
  return generateFeedUrlCombinations(baseUrls, feedUris)
}
