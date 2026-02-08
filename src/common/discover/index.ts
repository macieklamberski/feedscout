import {
  type DiscoverInput,
  type DiscoverMethodsConfigDefaults,
  type DiscoverOptionsInternal,
  type DiscoverResult,
  discoverMethodOrder,
  type UriEntry,
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

  // Step 3: Discover URIs using selected methods.
  const urisByMethod = discoverUris(methodsConfig)

  // Step 4: Normalize and deduplicate URIs per method group, deduping across groups.
  const seen = new Set<string>()
  const methodGroups: Array<Array<UriEntry>> = []

  for (const method of discoverMethodOrder) {
    const rawUris = urisByMethod[method]

    if (!rawUris?.length) {
      continue
    }

    const normalized = rawUris.map((entry) => {
      return normalizeUriEntry(entry, normalizeUrlFn, normalizedInput.url)
    })

    const unique = deduplicateUriEntries(normalized).filter((entry) => {
      const key = typeof entry === 'string' ? entry : entry.join('\0')

      if (seen.has(key)) {
        return false
      }

      seen.add(key)

      return true
    })

    if (unique.length > 0) {
      methodGroups.push(unique)
    }
  }

  // Step 5: Validate discovered URIs.
  const total = methodGroups.reduce((sum, group) => sum + group.length, 0)
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

      onProgress?.({ tested, total, found, current: url })

      // Stop trying alternatives on first valid result.
      if (result.isValid) {
        break
      }
    }
  }

  for (const group of methodGroups) {
    const foundBefore = found

    await processConcurrently(group, processUri, {
      concurrency,
      shouldStop: () => {
        return stopOnFirstResult && found > 0
      },
    })

    if (stopOnFirstMethod && found > foundBefore) {
      break
    }
  }

  return includeInvalid ? results : results.filter((result) => result.isValid)
}
