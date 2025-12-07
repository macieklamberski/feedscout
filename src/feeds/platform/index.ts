import type { DiscoverFetchFn } from '../../common/types.js'
import type { PlatformMethodOptions } from './types.js'

export const discoverPlatformUris = async (
  url: string,
  options: PlatformMethodOptions,
  fetchFn: DiscoverFetchFn,
): Promise<Array<string>> => {
  for (const handler of options.handlers) {
    if (handler.match(url)) {
      return handler.resolve(url, fetchFn)
    }
  }

  return []
}
