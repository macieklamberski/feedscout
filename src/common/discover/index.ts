import { coerceArray, isHttpUrl, resolveFeedProtocol } from 'trousse'
import {
  type DiscoverInput,
  type DiscoverInputObject,
  type DiscoverMethod,
  type DiscoverMethodsConfigDefaults,
  type DiscoverOptionsInternal,
  type DiscoverResult,
  type DiscoverStep,
  type DiscoverUriEntry,
  discoverMethodOrder,
} from '../types.js'
import { discoverUris } from '../uris/index.js'
import {
  processConcurrently,
  releaseParsedPage,
  toPositiveInteger,
  withTextBody,
} from '../utils.js'
import {
  attempt,
  htmlAcceptHeader,
  normalizeInput,
  normalizeMethodsConfig,
  normalizeUriEntry,
  omitReadPages,
  reportError,
  stripHash,
} from './utils.js'

const runDiscover = async <TValid>(
  input: DiscoverInput,
  options: DiscoverOptionsInternal<TValid>,
  defaults: DiscoverMethodsConfigDefaults,
): Promise<Array<DiscoverResult<TValid>>> => {
  const {
    methods,
    extractFn,
    resolveUrlFn,
    resolveSiteUrlFn,
    ignoredExtensions,
    acceptHeader,
    stopOnFirstMethod = false,
    stopOnFirstResult = false,
    concurrency = 3,
    maxUris = 50,
    includeInvalid = false,
    onProgress,
    onStep,
    onError,
  } = options
  const fetchFn = withTextBody(options.fetchFn)

  const reportStep = (step: DiscoverStep): void => {
    const url = 'url' in step ? step.url : undefined

    attempt(() => onStep?.(step), undefined, 'onStep', onError, url)
  }

  // Sanitize numeric options: reject NaN, < 1, and non-integer values, which
  // would otherwise hang the worker loop or fetch nothing.
  const safeConcurrency = toPositiveInteger(concurrency, 3)
  // No limit is a valid choice, which toPositiveInteger would read as invalid.
  const safeMaxUris =
    maxUris === Number.POSITIVE_INFINITY ? maxUris : toPositiveInteger(maxUris, 50)

  // Normalize input: string → fetch URL, object → use provided content.
  let hasInputFetchFailed = false
  const inputUrl = typeof input === 'string' ? input : undefined
  let requestedUrl: string | undefined

  if (inputUrl) {
    requestedUrl = resolveFeedProtocol(inputUrl)
    reportStep({ step: 'fetchInput', status: 'start', url: inputUrl })
  }

  const sourceInput = await normalizeInput(input, fetchFn, (error, context) => {
    hasInputFetchFailed = true
    reportError(onError, error, context)
  })

  if (inputUrl) {
    reportStep({ step: 'fetchInput', status: 'end', url: inputUrl })
  }

  // Step 1: Check if content is already valid (only if content is provided).
  if (sourceInput.content) {
    try {
      const result = await extractFn({
        url: sourceInput.url,
        content: sourceInput.content,
        headers: sourceInput.headers,
        status: sourceInput.status,
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

    // A feed can name a `file:` or `data:` URL as its site, which a fetch function may well read.
    if (siteUrl && isHttpUrl(siteUrl)) {
      reportStep({ step: 'resolveSiteUrl', status: 'start', url: siteUrl })

      try {
        const response = await fetchFn(siteUrl, { headers: { Accept: htmlAcceptHeader } })

        siteInput = {
          url: response.url,
          content: typeof response.body === 'string' ? response.body : '',
          headers: response.headers,
        }

        requestedUrl = siteUrl
      } catch (error) {
        reportError(onError, error, { phase: 'resolveSiteUrl', url: siteUrl })
      }

      reportStep({ step: 'resolveSiteUrl', status: 'end', url: siteUrl })
    }
  }

  // Step 2: Build methods config from input and selected methods.
  const methodsConfig = normalizeMethodsConfig(
    sourceInput,
    siteInput,
    methods,
    defaults,
    hasInputFetchFailed,
    requestedUrl,
  )

  // Step 3: Discover URIs using selected methods.
  reportStep({ step: 'collect', status: 'start' })

  const urisByMethod = await discoverUris(methodsConfig, fetchFn, onError)

  reportStep({ step: 'collect', status: 'end' })

  // Step 4: Normalize and deduplicate URIs per method group, deduping across groups.
  const seen = new Set<string>()
  // A link to a page already read, such as `#` or `#feeds`, is that page again and no feed.
  const readPageUrls = new Set(
    [
      sourceInput.content ? sourceInput.url : undefined,
      siteInput?.content ? siteInput.url : undefined,
    ]
      .filter((url) => url !== undefined)
      .map(stripHash),
  )
  const methodGroups: Array<{ method: DiscoverMethod; entries: Array<DiscoverUriEntry> }> = []
  let remaining = safeMaxUris

  // A method that ran keeps its group even when empty, so onStep reports it as a step with no
  // candidates.
  for (const method of discoverMethodOrder) {
    if (!methodsConfig[method]) {
      continue
    }

    if (remaining <= 0) {
      methodGroups.push({ method, entries: [] })
      continue
    }

    const rawUris = urisByMethod[method] ?? []

    // A relative URI belongs to the page it was found on. When the input is a feed, that is the
    // site page for every method except Feed, which reads the feed itself.
    const baseUrl = method === 'feed' ? sourceInput.url : (siteInput ?? sourceInput).url
    const normalized = rawUris
      .map((entry) => {
        return normalizeUriEntry(entry, resolveUrlFn, baseUrl, onError, ignoredExtensions)
      })
      .map((entry) => (entry ? omitReadPages(entry, readPageUrls) : undefined))
      .filter((entry) => entry !== undefined)

    // Each alternative counts on its own, so a page link to a URL that a platform entry already
    // offers as one of its alternatives is not fetched a second time.
    const unique = normalized.filter((entry) => {
      const uris = coerceArray(entry.uri)

      if (uris.some((uri) => seen.has(uri))) {
        return false
      }

      for (const uri of uris) {
        seen.add(uri)
      }

      return true
    })

    const capped = unique.slice(0, remaining)
    remaining -= capped.length
    methodGroups.push({ method, entries: capped })
  }

  // Step 5: Validate discovered URIs.
  const total = methodGroups.reduce((sum, group) => sum + group.entries.length, 0)
  const recorded: Array<{ entryIndex: number; result: DiscoverResult<TValid> }> = []

  let tested = 0
  let found = 0

  // Candidates that redirect to one URL, like /feed and /rss on WordPress, all come back under
  // the final URL. Only the earliest candidate's result for each URL is kept, whichever finishes
  // first, so its method and hint do not depend on fetch timing.
  const recordResult = (result: DiscoverResult<TValid>, entryIndex: number): void => {
    const existing = recorded.find((record) => {
      return record.result.url === result.url && record.result.isValid === result.isValid
    })

    if (!existing) {
      recorded.push({ entryIndex, result })

      if (result.isValid) {
        found += 1
      }

      return
    }

    if (entryIndex < existing.entryIndex) {
      existing.entryIndex = entryIndex
      existing.result = result
    }
  }

  const fetchAndExtract = async (url: string): Promise<DiscoverResult<TValid>> => {
    try {
      const fetchResult = await fetchFn(url, { headers: { Accept: acceptHeader } })

      return await extractFn({
        url: fetchResult.url,
        content: typeof fetchResult.body === 'string' ? fetchResult.body : '',
        headers: fetchResult.headers,
        status: fetchResult.status,
      })
    } catch (error) {
      return { url, isValid: false, error }
    }
  }

  const processUri = async (
    entry: DiscoverUriEntry,
    method: DiscoverMethod,
    entryIndex: number,
  ): Promise<void> => {
    const alternatives = coerceArray(entry.uri)

    for (const [index, url] of alternatives.entries()) {
      const extracted = await fetchAndExtract(url)
      const result = entry.hint
        ? { ...extracted, method, hint: entry.hint }
        : { ...extracted, method }

      recordResult(result, entryIndex)

      // The total counts candidates, so a candidate counts as tested once no alternative is left
      // to try.
      if (result.isValid || index === alternatives.length - 1) {
        tested += 1
      }

      attempt(
        () => onProgress?.({ tested, total, found, current: url, method, result }),
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

  let entryOffset = 0

  for (const { method, entries } of methodGroups) {
    if (stopOnFirstResult && found > 0) {
      break
    }

    const foundBefore = found

    reportStep({ step: 'validate', status: 'start', method, total: entries.length })

    const validateEntry = (entry: DiscoverUriEntry, index: number): Promise<void> => {
      return processUri(entry, method, entryOffset + index)
    }

    await processConcurrently(entries, validateEntry, {
      concurrency: safeConcurrency,
      shouldStop: () => {
        return stopOnFirstResult && found > 0
      },
    })

    reportStep({
      step: 'validate',
      status: 'end',
      method,
      total: entries.length,
      found: found - foundBefore,
    })

    entryOffset += entries.length

    if (stopOnFirstMethod && found > foundBefore) {
      break
    }
  }

  // Candidates finish in any order, so the results follow the order the candidates were listed in.
  const results = recorded
    .sort((first, second) => first.entryIndex - second.entryIndex)
    .map((record) => record.result)

  return includeInvalid ? results : results.filter((result) => result.isValid)
}

export const discover = async <TValid>(
  input: DiscoverInput,
  options: DiscoverOptionsInternal<TValid>,
  defaults: DiscoverMethodsConfigDefaults,
): Promise<Array<DiscoverResult<TValid>>> => {
  try {
    return await runDiscover(input, options, defaults)
  } finally {
    releaseParsedPage()
  }
}
