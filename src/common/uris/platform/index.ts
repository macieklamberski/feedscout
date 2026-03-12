import type { DiscoverFetchFn, DiscoverUriEntry } from '../../types.js'
import type { PlatformMethodOptions } from './types.js'

export const discoverUrisFromPlatform = async (
  html: string,
  headers: Headers | undefined,
  options: PlatformMethodOptions,
  fetchFn?: DiscoverFetchFn,
): Promise<Array<DiscoverUriEntry>> => {
  const { baseUrl, handlers } = options

  for (const handler of handlers) {
    try {
      if (handler.match(baseUrl, html, headers)) {
        return await handler.resolve(baseUrl, html, fetchFn)
      }
    } catch {
      // Handler error - continue to next.
    }
  }

  return []
}
