import type { ExtractFn, FeedInfo } from '../common/types.js'
import locales from '../locales.json' with { type: 'json' }
import { discoverFeedUris } from '../methods/index.js'
import { createNativeFetchAdapter } from './adapters.js'
import { createFeedsmithExtractor } from './extractors.js'
import type { DiscoverFeedsInput, DiscoverFeedsOptions } from './types.js'
import { normalizeInput, normalizeMethodsConfig, processConcurrently } from './utils.js'

export const discoverFeeds = async <T extends FeedInfo = FeedInfo>(
  input: DiscoverFeedsInput,
  options: DiscoverFeedsOptions<T>,
): Promise<Array<T>> => {
  const {
    methods,
    fetchFn = createNativeFetchAdapter(),
    extractFn = createFeedsmithExtractor() as ExtractFn<T>,
    concurrency = 3,
    stopOnFirst = false,
    includeInvalid = false,
    onProgress,
  } = options

  // Normalize input: string → fetch URL, object → use provided content.
  const normalizedInput = await normalizeInput(input, fetchFn)

  // Step 1: Check if content is already a feed (only if content is provided).
  if (normalizedInput.content) {
    const result = await extractFn({
      url: normalizedInput.url,
      content: normalizedInput.content,
    })

    // Early return if it's a feed.
    if (result.isFeed) {
      return [result]
    }
  }

  // Step 2: Build methods config from input and selected methods.
  const methodsConfig = normalizeMethodsConfig(normalizedInput, methods)

  // Step 3: Discover URIs using selected methods.
  const uris = discoverFeedUris(methodsConfig)

  // Step 4: Validate discovered URIs.
  if (!fetchFn) {
    throw new Error(locales.errors.fetchFnRequired)
  }

  const feedInfos: Array<T> = []
  let tested = 0
  let found = 0

  const processUri = async (url: string): Promise<void> => {
    try {
      const fetchResult = await fetchFn(url)
      const extractResult = await extractFn({
        url: fetchResult.url,
        content: typeof fetchResult.body === 'string' ? fetchResult.body : '',
      })

      feedInfos.push(extractResult)

      if (extractResult.isFeed) {
        found += 1
      }
    } catch (error) {
      feedInfos.push({ url, isFeed: false, error } as T)
    } finally {
      tested += 1

      onProgress?.({
        tested,
        total: uris.length,
        found,
        current: url,
      })
    }
  }

  await processConcurrently(uris, processUri, {
    concurrency,
    shouldStop: () => stopOnFirst && found > 0,
  })

  // Filter results: by default only return valid feeds.
  return includeInvalid ? feedInfos : feedInfos.filter((info) => info.isFeed)
}
