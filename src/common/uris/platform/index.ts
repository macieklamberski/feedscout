import { isHttpUrl, type NormalizeOptions, normalizeUrl, stripWww, trimUrlValues } from 'trousse'
import { reportError } from '../../discover/utils.js'
import type {
  DiscoverInputObject,
  DiscoverOnErrorFn,
  DiscoverRef,
  DiscoverUriEntry,
  DiscoverUriHint,
  FetchFn,
} from '../../types.js'
import { selectHostHandlers } from './hosts.js'
import type { PlatformHandler, PlatformMethodOptions } from './types.js'

type PlatformPage = Omit<DiscoverInputObject, 'status'>

// The same page answers under https, with www, with a trailing slash, without the fragment and
// with the query reordered.
const samePageOptions: NormalizeOptions = {
  stripScheme: true,
  stripWww: true,
  stripTrailingSlash: true,
  stripHash: true,
  sortQueryParams: true,
  stripEmptyQuery: true,
  stripAuthentication: true,
  normalizeEncoding: true,
}

const readPageUrl = (url: string): string => {
  return trimUrlValues(normalizeUrl(url, { collapseSlashes: true }))
}

const matchesUrlAlone = (handler: PlatformHandler, url: string): boolean => {
  try {
    return handler.match(url)
  } catch {}

  return false
}

// A handler that takes the URL alone owns its host, so it goes ahead of the ones that need a
// marker. A page that links or quotes another platform's marker stays with its own handler.
const orderHandlers = (handlers: Array<PlatformHandler>, url: string): Array<PlatformHandler> => {
  const urlHandlers = handlers.filter((handler) => matchesUrlAlone(handler, url))
  const markerHandlers = handlers.filter((handler) => !urlHandlers.includes(handler))

  return [...urlHandlers, ...markerHandlers]
}

// The hint of the handler feed the URL is, read as the URL arrived.
export const getFeedHint = (
  handlers: Array<PlatformHandler>,
  url: string,
): DiscoverUriHint | undefined => {
  for (const handler of handlers) {
    try {
      const hint = handler.getFeedHint?.(url)

      if (hint) {
        return hint
      }
    } catch {}
  }
}

export const discoverUrisFromPlatform = async (
  content: string | undefined,
  headers: Headers | undefined,
  options: PlatformMethodOptions,
  fetchFn?: FetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<Array<DiscoverUriEntry>> => {
  const { baseUrl, requestedUrl, handlers, enrichFn } = options
  const entries: Array<DiscoverUriEntry> = []
  const refs: Array<DiscoverRef> = []

  // Host checks pass a `foo://` URL on a platform host, whose empty pathname no handler expects.
  if (!isHttpUrl(baseUrl)) {
    return entries
  }

  // A URL that is one of a handler's feeds is that feed, and no page parser reads it.
  const ownFeedHint = getFeedHint(handlers, baseUrl)

  if (ownFeedHint) {
    return [{ uri: baseUrl, hint: ownFeedHint }]
  }

  const fetchedPageUrl = readPageUrl(baseUrl)
  const fetchedPage: PlatformPage = { url: fetchedPageUrl, content, headers }
  const candidatePages = [fetchedPage]
  let refsUrl = fetchedPageUrl

  // A page that redirects, to a sign-in page for example, is fetched under another URL. The
  // content and headers belong to that URL, so the requested one is tried without them.
  if (requestedUrl && isHttpUrl(requestedUrl)) {
    const requestedPageUrl = readPageUrl(requestedUrl)
    const normalizedRequested = normalizeUrl(requestedPageUrl, samePageOptions)
    const normalizedFetched = normalizeUrl(fetchedPageUrl, samePageOptions)
    const requestedHost = stripWww(new URL(requestedPageUrl).hostname)
    const fetchedHost = stripWww(new URL(fetchedPageUrl).hostname)

    // A site that moved to another host still answers its old feed URLs with entries that
    // stopped the day it moved.
    if (normalizedRequested !== normalizedFetched && requestedHost === fetchedHost) {
      candidatePages.push({ url: requestedPageUrl })
    }
  }

  for (const page of candidatePages) {
    // Without content and headers every match is on the URL alone, and the order already holds.
    const hasMarkers = page.content !== undefined || page.headers !== undefined
    const hostHandlers = selectHostHandlers(handlers, page.url)
    const pageHandlers = hasMarkers ? orderHandlers(hostHandlers, page.url) : hostHandlers

    for (const handler of pageHandlers) {
      try {
        if (!handler.match(page.url, page.content, page.headers)) {
          continue
        }

        // A handler that takes the fetched URL alone and refuses it with its content has read the
        // page and declined it, the sign-up page of an unregistered blog for example.
        if (page !== fetchedPage && handler.match(fetchedPageUrl)) {
          const hasDeclined = !handler.match(fetchedPageUrl, content, headers)

          if (hasDeclined) {
            continue
          }
        }

        const resolved = await handler.resolve(page.url, page.content, page.headers, fetchFn)

        // A handler that matched but found nothing leaves the page to the handlers after it.
        if (resolved.length === 0) {
          continue
        }

        for (const item of resolved) {
          if ('uri' in item) {
            entries.push(item)
            continue
          }

          refs.push(item)
        }

        break
      } catch (error) {
        reportError(onError, error, { phase: 'platformHandler', url: page.url })
      }
    }

    if (entries.length > 0 || refs.length > 0) {
      refsUrl = page.url
      break
    }
  }

  if (!enrichFn) {
    return entries
  }

  // Each ref is enriched on its own, so one that fails leaves the icons of the others.
  for (const ref of refs) {
    try {
      const uris = await enrichFn(ref)

      for (const uri of uris ?? []) {
        entries.push({ uri })
      }
    } catch (error) {
      reportError(onError, error, { phase: 'enrichFn', url: refsUrl })
    }
  }

  return entries
}
