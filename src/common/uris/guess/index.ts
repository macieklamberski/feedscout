import type { UriEntry } from '../../types.js'
import type { GuessMethodOptions } from './types.js'
import {
  generatePathUrlCombinations,
  generateUrlCombinations,
  getAncestorPathBases,
} from './utils.js'

export const discoverUrisFromGuess = (options: GuessMethodOptions): Array<UriEntry> => {
  const { baseUrl, uris, additionalBaseUrls = [], maxAncestorDepth = 0 } = options
  const baseUrls = [baseUrl, ...additionalBaseUrls]

  // Origin-level combinations come first: root-level feeds are the most common case, and the
  // discover-level maxUris cap truncates from the tail.
  const combinations = generateUrlCombinations(baseUrls, uris)

  if (maxAncestorDepth > 0) {
    const ancestorBases = getAncestorPathBases(baseUrl, maxAncestorDepth)
    combinations.push(...generatePathUrlCombinations(ancestorBases, uris))
  }

  return combinations
}
