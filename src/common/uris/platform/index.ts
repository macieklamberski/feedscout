import { reportError } from '../../discover/utils.js'
import type {
  DiscoverFetchFn,
  DiscoverOnErrorFn,
  DiscoverRef,
  DiscoverUriEntry,
} from '../../types.js'
import type { PlatformMethodOptions } from './types.js'

export const discoverUrisFromPlatform = async (
  content: string | undefined,
  headers: Headers | undefined,
  options: PlatformMethodOptions,
  fetchFn?: DiscoverFetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<Array<DiscoverUriEntry>> => {
  const { baseUrl, handlers, enrichFn } = options
  const entries: Array<DiscoverUriEntry> = []
  const refs: Array<DiscoverRef> = []

  for (const handler of handlers) {
    try {
      if (!handler.match(baseUrl, content, headers)) {
        continue
      }

      const resolved = await handler.resolve(baseUrl, content, headers, fetchFn)

      for (const item of resolved) {
        if ('uri' in item) {
          entries.push(item)
          continue
        }

        refs.push(item)
      }

      break
    } catch {
      // Handler error - continue to next.
    }
  }

  if (!enrichFn || refs.length === 0) {
    return entries
  }

  try {
    const enriched = await enrichFn(refs)

    for (const uris of enriched) {
      for (const uri of uris ?? []) {
        entries.push({ uri })
      }
    }
  } catch (error) {
    reportError(onError, error, { phase: 'enrichFn', url: baseUrl })
  }

  return entries
}
