import { isHttpUrl, parseUrl } from 'trousse'
import { reportError } from '../../discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverRef, DiscoverUriEntry, FetchFn } from '../../types.js'
import type { PlatformMethodOptions } from './types.js'

const repeatedSlashRegex = /\/{2,}/g

export const discoverUrisFromPlatform = async (
  content: string | undefined,
  headers: Headers | undefined,
  options: PlatformMethodOptions,
  fetchFn?: FetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<Array<DiscoverUriEntry>> => {
  const { baseUrl, handlers, enrichFn } = options
  const entries: Array<DiscoverUriEntry> = []
  const refs: Array<DiscoverRef> = []

  // Host checks pass a `foo://` URL on a platform host, whose empty pathname no handler expects.
  if (!isHttpUrl(baseUrl)) {
    return entries
  }

  // A sloppy link can double a slash in the path, which handlers that split the path and handlers
  // that match it with a regex read differently, so every handler sees the path collapsed.
  const parsedUrl = parseUrl(baseUrl)
  let pageUrl = baseUrl

  if (parsedUrl?.pathname.includes('//')) {
    parsedUrl.pathname = parsedUrl.pathname.replace(repeatedSlashRegex, '/')
    pageUrl = parsedUrl.href
  }

  for (const handler of handlers) {
    try {
      if (!handler.match(pageUrl, content, headers)) {
        continue
      }

      const resolved = await handler.resolve(pageUrl, content, headers, fetchFn)

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
      reportError(onError, error, { phase: 'platformHandler', url: pageUrl })
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
      reportError(onError, error, { phase: 'enrichFn', url: baseUrl })
    }
  }

  return entries
}
