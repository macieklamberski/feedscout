import type {
  DiscoverInput,
  DiscoverMethodsConfigDefaults,
  DiscoverOptionsInternal,
  DiscoverResult,
} from '../types.js'
import { discoverUris } from '../uris/index.js'
import { processConcurrently } from '../utils.js'
import { normalizeInput, normalizeMethodsConfig } from './utils.js'

export const discover = async <TValid>(
  input: DiscoverInput,
  options: DiscoverOptionsInternal<TValid>,
  defaults: DiscoverMethodsConfigDefaults,
): Promise<Array<DiscoverResult<TValid>>> => {
  const {
    methods,
    fetchFn,
    extractFn,
    normalizeUrlFn,
    concurrency = 3,
    stopOnFirstResult = false,
    includeInvalid = false,
    onProgress,
    additionalUris = [],
  } = options

  // Normalize input: string → fetch URL, object → use provided content.
  const normalizedInput = await normalizeInput(input, fetchFn)

  // Step 1: Check if content is already valid (only if content is provided).
  if (normalizedInput.content) {
    const result = await extractFn({
      url: normalizedInput.url,
      content: normalizedInput.content,
    })

    if (result.isValid) {
      return [result]
    }
  }

  // Step 2: Build methods config from input and selected methods.
  const methodsConfig = normalizeMethodsConfig(normalizedInput, methods, defaults)

  // Step 3: Discover URIs using selected methods and normalize them.
  const rawUris = [...additionalUris, ...discoverUris(methodsConfig)]
  const uris = [...new Set(rawUris.map((uri) => normalizeUrlFn(uri, normalizedInput.url)))]

  // Step 4: Validate discovered URIs.
  const results: Array<DiscoverResult<TValid>> = []
  let tested = 0
  let found = 0

  const processUri = async (url: string): Promise<void> => {
    try {
      const fetchResult = await fetchFn(url)
      const extractResult = await extractFn({
        url: fetchResult.url,
        content: typeof fetchResult.body === 'string' ? fetchResult.body : '',
      })

      results.push(extractResult)

      if (extractResult.isValid) {
        found += 1
      }
    } catch (error) {
      results.push({ url, isValid: false, error })
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
    shouldStop: () => stopOnFirstResult && found > 0,
  })

  return includeInvalid ? results : results.filter((result) => result.isValid)
}
