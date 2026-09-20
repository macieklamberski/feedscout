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
import { processConcurrently, toPositiveInteger } from '../utils.js'
import {
  attempt,
  normalizeInput,
  normalizeMethodsConfig,
  normalizeUriEntry,
  reportError,
} from './utils.js'

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
    maxUris = 50,
    includeInvalid = false,
    onProgress,
    onError,
  } = options

  // Sanitize numeric options: reject NaN, < 1, and non-integer values, which
  // would otherwise hang the worker loop or fetch nothing.
  const safeConcurrency = toPositiveInteger(concurrency, 3)
  const safeMaxUris = toPositiveInteger(maxUris, 50)

  // Normalize input: string → fetch URL, object → use provided content.
  const sourceInput = await normalizeInput(input, fetchFn, onError)

  // A URL string means Feedscout fetched the input itself. A method that the response left without
  // content or headers is then skipped and reported, where an input object would be a usage error.
  const onSkip =
    typeof input === 'string'
      ? (error: Error) => reportError(onError, error, { phase: 'fetchInput', url: sourceInput.url })
      : undefined

  // Step 1: Check if content is already valid (only if content is provided).
  if (sourceInput.content) {
    try {
      const result = await extractFn({
        url: sourceInput.url,
        content: sourceInput.content,
        headers: sourceInput.headers,
      })

      if (result.isValid) {
        return [result]
      }
    } catch (error) {
      reportError(onError, error, { phase: 'extractFn', url: sourceInput.url })
    }
  }

  // Step 1.5: Resolve site input if resolveSiteUrlFn is provided.
  let siteInput: DiscoverInputObject | undefined

  if (resolveSiteUrlFn) {
    const siteUrl = attempt(
      () => resolveSiteUrlFn(sourceInput, resolveUrlFn),
      undefined,
      'resolveSiteUrlFn',
      onError,
      sourceInput.url,
    )

    if (siteUrl) {
      try {
        const response = await fetchFn(siteUrl)

        siteInput = {
          url: response.url,
          content: typeof response.body === 'string' ? response.body : '',
          headers: response.headers,
        }
      } catch (error) {
        reportError(onError, error, { phase: 'resolveSiteUrl', url: siteUrl })
      }
    }
  }

  // Step 2: Build methods config from input and selected methods.
  const methodsConfig = normalizeMethodsConfig(sourceInput, siteInput, methods, defaults, onSkip)

  // Step 3: Discover URIs using selected methods.
  const urisByMethod = await discoverUris(methodsConfig, fetchFn)

  // Step 4: Normalize and deduplicate URIs per method group, deduping across groups.
  const seen = new Set<string>()
  const methodGroups: Array<{ method: DiscoverMethod; entries: Array<DiscoverUriEntry> }> = []
  let remaining = safeMaxUris

  for (const method of discoverMethodOrder) {
    if (remaining <= 0) {
      break
    }

    const rawUris = urisByMethod[method]

    if (!rawUris || rawUris.length === 0) {
      continue
    }

    // A relative URI belongs to the page it was found on. When the input is a feed, that is the
    // site page for every method except Feed, which reads the feed itself.
    const baseUrl = method === 'feed' ? sourceInput.url : (siteInput ?? sourceInput).url
    const normalized = rawUris.map((entry) => {
      return normalizeUriEntry(entry, resolveUrlFn, baseUrl, onError)
    })

    const unique = normalized.filter((entry) => {
      // Sort array alternatives so the key is order-independent.
      const key = typeof entry.uri === 'string' ? entry.uri : [...entry.uri].sort().join('\0')

      if (seen.has(key)) {
        return false
      }

      seen.add(key)

      return true
    })

    if (unique.length > 0) {
      const capped = unique.slice(0, remaining)
      remaining -= capped.length
      methodGroups.push({ method, entries: capped })
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

      attempt(
        () => onProgress?.({ tested, total, found, current: url }),
        undefined,
        'onProgress',
        onError,
        url,
      )

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
