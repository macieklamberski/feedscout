import type { PlatformMethodOptions } from './types.js'

export const discoverUrisFromPlatform = (
  html: string,
  options: PlatformMethodOptions,
): Array<string> => {
  const { baseUrl, handlers } = options

  try {
    for (const handler of handlers) {
      if (handler.match(baseUrl)) {
        return handler.resolve(baseUrl, html)
      }
    }
  } catch {
    // Invalid URL or handler error - return empty.
  }

  return []
}
