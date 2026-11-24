import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseLobstersUrl } from '../../feeds/platforms/lobsters.js'

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return parseLobstersUrl(url)?.kind === 'user'
  },

  resolve: (url) => {
    const parsed = parseLobstersUrl(url)

    if (parsed?.kind !== 'user') {
      return []
    }

    return [{ uri: `https://lobste.rs/avatars/${parsed.username}-100.png` }]
  },
}
