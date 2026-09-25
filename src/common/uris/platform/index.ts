import { isHttpUrl } from 'trousse'
import { reportError } from '../../discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverRef, DiscoverUriEntry, FetchFn } from '../../types.js'
import type { PlatformMethodOptions } from './types.js'

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

  for (const handler of handlers) {
    try {
      if (!handler.match(baseUrl, content, headers)) {
        continue
      }

      const resolved = await handler.resolve(baseUrl, content, headers, fetchFn)

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
      reportError(onError, error, { phase: 'platformHandler', url: baseUrl })
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
