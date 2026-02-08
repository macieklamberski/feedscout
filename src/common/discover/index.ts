import type {
  DiscoverInput,
  DiscoverMethodsConfigDefaults,
  DiscoverOptionsInternal,
  DiscoverResult,
  UriEntry,
} from '../types.js'
import { discoverUris } from '../uris/index.js'
import { deduplicateUriEntries, processConcurrently } from '../utils.js'
import { normalizeInput, normalizeMethodsConfig, normalizeUriEntry } from './utils.js'

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
    stopOnFirstMethod = false,
    stopOnFirstResult = false,
    concurrency = 3,
    includeInvalid = false,
    onProgress,
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

  // Step 3: Discover URIs using selected methods, normalize, and deduplicate.
  const rawUris = discoverUris(methodsConfig, stopOnFirstMethod)
  const normalizedUris = rawUris.map((entry) => {
    return normalizeUriEntry(entry, normalizeUrlFn, normalizedInput.url)
  })
  const uris = deduplicateUriEntries(normalizedUris)

  // Step 4: Validate discovered URIs.
  const results: Array<DiscoverResult<TValid>> = []
  let tested = 0
  let found = 0

  const fetchAndExtract = async (url: string): Promise<DiscoverResult<TValid>> => {
    try {
      const fetchResult = await fetchFn(url)

      return await extractFn({
        url: fetchResult.url,
        content: typeof fetchResult.body === 'string' ? fetchResult.body : '',
      })
    } catch (error) {
      return { url, isValid: false, error } as DiscoverResult<TValid>
    }
  }

  const processUri = async (entry: UriEntry): Promise<void> => {
    const alternatives = typeof entry === 'string' ? [entry] : entry

    for (const url of alternatives) {
      const result = await fetchAndExtract(url)

      results.push(result)
      tested += 1

      if (result.isValid) {
        found += 1
      }

      onProgress?.({
        tested,
        total: uris.length,
        found,
        current: url,
      })

      // Stop trying alternatives on first valid result.
      if (result.isValid) {
        break
      }
    }
  }

  await processConcurrently(uris, processUri, {
    concurrency,
    shouldStop: () => stopOnFirstResult && found > 0,
  })

  return includeInvalid ? results : results.filter((result) => result.isValid)
}
