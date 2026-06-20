import {
  type DiscoverInput,
  type DiscoverInputObject,
  type DiscoverMethod,
  type DiscoverMethodsConfigDefaults,
  type DiscoverOptionsInternal,
  type DiscoverResult,
  type DiscoverUriEntry,
  discoverMethodOrder,
} from '../types.js'
import { discoverUris } from '../uris/index.js'
import { processConcurrently } from '../utils.js'
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
    resolveUrlFn,
    resolveSiteUrlFn,
    stopOnFirstMethod = false,
    stopOnFirstResult = false,
    concurrency = 3,
    includeInvalid = false,
    onProgress,
  } = options

  // Clamp to a positive integer and cap the upper bound; anything invalid
  // (NaN, < 1, non-integer) falls back to the default.
  const safeConcurrency =
    Number.isInteger(concurrency) && concurrency >= 1 ? Math.min(concurrency, 100) : 3

  // Normalize input: string → fetch URL, object → use provided content.
  const sourceInput = await normalizeInput(input, fetchFn)

  // Step 1: Check if content is already valid (only if content is provided).
  if (sourceInput.content) {
    const result = await extractFn({
      url: sourceInput.url,
      content: sourceInput.content,
      headers: sourceInput.headers,
    })

    if (result.isValid) {
      return [result]
    }
  }

  // Step 1.5: Resolve site input if resolveSiteUrlFn is provided.
  let siteInput: DiscoverInputObject | undefined

  if (resolveSiteUrlFn) {
    const siteUrl = resolveSiteUrlFn(sourceInput, resolveUrlFn)

    if (siteUrl) {
      try {
        const response = await fetchFn(siteUrl)

        siteInput = {
          url: response.url,
          content: typeof response.body === 'string' ? response.body : '',
          headers: response.headers,
        }
      } catch {}
    }
  }

  // Step 2: Build methods config from input and selected methods.
  const methodsConfig = normalizeMethodsConfig(sourceInput, siteInput, methods, defaults)

  // Step 3: Discover URIs using selected methods.
  const urisByMethod = await discoverUris(methodsConfig, fetchFn)

  // Step 4: Normalize and deduplicate URIs per method group, deduping across groups.
  const seen = new Set<string>()
  const methodGroups: Array<{ method: DiscoverMethod; entries: Array<DiscoverUriEntry> }> = []

  for (const method of discoverMethodOrder) {
    const rawUris = urisByMethod[method]

    if (!rawUris || rawUris.length === 0) {
      continue
    }

    const normalized = rawUris.map((entry) => {
      return normalizeUriEntry(entry, resolveUrlFn, sourceInput.url)
    })

    const unique = normalized.filter((entry) => {
      const key = typeof entry.uri === 'string' ? entry.uri : entry.uri.join('\0')

      if (seen.has(key)) {
        return false
      }

      seen.add(key)

      return true
    })

    if (unique.length > 0) {
      methodGroups.push({ method, entries: unique })
    }
  }

  // Step 5: Validate discovered URIs.
  const total = methodGroups.reduce((sum, group) => sum + group.entries.length, 0)
  const results: Array<DiscoverResult<TValid>> = []
  let tested = 0
  let found = 0

  const fetchAndExtract = async (url: string): Promise<DiscoverResult<TValid>> => {
    try {
      const fetchResult = await fetchFn(url)

      return await extractFn({
        url: fetchResult.url,
        content: typeof fetchResult.body === 'string' ? fetchResult.body : '',
        headers: fetchResult.headers,
        status: fetchResult.status,
      })
    } catch (error) {
      return { url, isValid: false, error } as DiscoverResult<TValid>
    }
  }

  const processUri = async (entry: DiscoverUriEntry, method: DiscoverMethod): Promise<void> => {
    const alternatives = typeof entry.uri === 'string' ? [entry.uri] : entry.uri

    for (const url of alternatives) {
      const result = await fetchAndExtract(url)

      results.push(entry.hint ? { ...result, method, hint: entry.hint } : { ...result, method })
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

  for (const { method, entries } of methodGroups) {
    const foundBefore = found

    await processConcurrently(entries, (entry) => processUri(entry, method), {
      concurrency: safeConcurrency,
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
