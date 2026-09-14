import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const blogHostRegex = /\.blog\d*\.fc2\.com$/i

export const fc2Handler: PlatformHandler = {
  match: (url) => {
    try {
      return blogHostRegex.test(new URL(url).hostname)
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)

      return [{ uri: `${origin}/?xml`, hint: composeHint('fc2:posts') }]
    } catch {}

    return []
  },
}
