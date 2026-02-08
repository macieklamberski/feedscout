import type { UriEntry } from '../../types.js'
import type { PlatformMethodOptions } from './types.js'

export const discoverUrisFromPlatform = (
  html: string,
  options: PlatformMethodOptions,
): Array<UriEntry> => {
  const { baseUrl, handlers } = options

  for (const handler of handlers) {
    try {
      if (handler.match(baseUrl)) {
        return handler.resolve(baseUrl, html)
      }
    } catch {
      // Handler error - continue to next.
    }
  }

  return []
}
