import { feedUrisBalanced } from './defaults.js'
import type { Options, Result } from './types.js'
import { generateFeedUrlCombinations, processConcurrently } from './utils.js'
import { createContentValidator } from './validators.js'

export { feedUrisBalanced, feedUrisComprehensive, feedUrisMinimal } from './defaults.js'
export { getSubdomainVariants, getWwwCounterpart } from './subdomains.js'

export const discoverCommonFeedUrisFromGuess = async (
  baseUrl: string,
  options: Options,
): Promise<Array<Result>> => {
  const {
    fetchFn,
    feedUris = feedUrisBalanced,
    validateFn = createContentValidator(),
    concurrency = 3,
    stopOnFirst = false,
    includeInvalid = false,
    onProgress,
    additionalBaseUrls = [],
  } = options

  const results: Array<Result> = []
  let tested = 0
  let found = 0

  const baseUrls = [baseUrl, ...additionalBaseUrls]
  const urlsToTest = generateFeedUrlCombinations(baseUrls, feedUris)

  const processUrl = async (url: string): Promise<void> => {
    try {
      const response = await fetchFn(url)
      const result = await validateFn(response)

      if (result.isFeed || includeInvalid) {
        results.push(result)
      }

      if (result.isFeed) {
        found += 1
      }
    } catch {
      if (includeInvalid) {
        results.push({ url, isFeed: false })
      }
    } finally {
      tested += 1

      onProgress?.({
        tested,
        total: urlsToTest.length,
        found,
        current: url,
      })
    }
  }

  // Process URLs with concurrency limit.
  await processConcurrently(urlsToTest, processUrl, {
    concurrency,
    shouldStop: () => stopOnFirst && found > 0,
  })

  return results
}
