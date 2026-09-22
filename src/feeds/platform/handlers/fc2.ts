import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const blogHostRegex = /\.blog\d*\.fc2\.com$/i

export const fc2Handler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return blogHostRegex.test(parsedUrl.hostname)
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin } = parsedUrl

    return [{ uri: `${origin}/?xml`, hint: composeHint('fc2:posts') }]
  },
}
