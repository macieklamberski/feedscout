import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Jimdo Creator answers every page with the site's id in this header, on its own hosts and on
// custom domains alike.
export const isJimdoHeaders = (headers: Headers): boolean => {
  return headers.has('x-jimdo-wid')
}

export const jimdoHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { headers: isJimdoHeaders })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss/blog`, hint: composeHint('jimdo:blog') }]
  },
}
