import type { UriEntry } from '../../types.js'
import type { GuessMethodOptions } from './types.js'
import {
  extractSectionBaseUrls,
  generatePathUrlCombinations,
  generateUrlCombinations,
  getAncestorPathBases,
} from './utils.js'

export const discoverUrisFromGuess = (options: GuessMethodOptions): Array<UriEntry> => {
  const { baseUrl, uris, additionalBaseUrls = [], maxAncestorDepth = 0 } = options
  const { content, sectionNames } = options
  const baseUrls = [baseUrl, ...additionalBaseUrls]

  // Origin-level combinations come first: root-level feeds are the most common case, and the
  // discover-level maxUris cap truncates from the tail.
  const combinations = generateUrlCombinations(baseUrls, uris)
  const pathBases: Array<string> = []

  if (maxAncestorDepth > 0) {
    pathBases.push(...getAncestorPathBases(baseUrl, maxAncestorDepth))
  }

  if (content && sectionNames && sectionNames.length > 0) {
    for (const sectionBase of extractSectionBaseUrls(content, baseUrl, sectionNames)) {
      if (!pathBases.includes(sectionBase)) {
        pathBases.push(sectionBase)
      }
    }
  }

  if (pathBases.length > 0) {
    combinations.push(...generatePathUrlCombinations(pathBases, uris))
  }

  return combinations
}
